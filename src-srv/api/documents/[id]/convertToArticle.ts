import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { Block, Document } from '@ttab/elephant-api/newsdoc'
import {
  appendAssignment,
  appendDocumentToAssignment
} from '../../../../shared/createYItem.js'
import { deriveNewPlanning } from '@/shared/convertArticleType.js'
import { planningDocumentTemplate } from '@/shared/templates/planningDocumentTemplate.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { isValidUUID } from '@/shared/isValidUUID.js'
import {
  getContextFromValidSession,
  isContext,
  type Context
} from '../../../lib/context.js'
import { snapshot } from '../../../utils/snapshot.js'
import logger from '../../../lib/logger.js'

const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

interface ConvertToArticleBody {
  targetDate?: string
  sourcePlanningId?: string
  isoDateTime?: string
}

export const POST: RouteHandler = async (
  req: Request,
  { collaborationServer, repository, res }
) => {
  const sourceId = req.params.id
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as {
    accessToken?: string
    user?: Context['user']
  } | undefined

  const context = getContextFromValidSession(session)
  if (!isContext(context)) {
    return context
  }
  const { accessToken } = context

  if (!isValidUUID(sourceId)) {
    return { statusCode: 400, statusMessage: 'Invalid source document id' }
  }

  const { targetDate, sourcePlanningId, isoDateTime }
    = (req.body ?? {}) as ConvertToArticleBody

  if (!targetDate || !DATE_RE.test(targetDate)) {
    return {
      statusCode: 400,
      statusMessage: 'targetDate must be YYYY-MM-DD'
    }
  }

  if (sourcePlanningId !== undefined && !isValidUUID(sourcePlanningId)) {
    return { statusCode: 400, statusMessage: 'Invalid sourcePlanningId' }
  }

  const sourceResponse = await repository.getDocument({
    uuid: sourceId,
    accessToken
  })
  const sourceDoc = sourceResponse?.document
  if (!sourceDoc) {
    return { statusCode: 404, statusMessage: 'Source document not found' }
  }
  if (sourceDoc.type !== 'core/article#timeless') {
    return {
      statusCode: 400,
      statusMessage: 'Source must be of type core/article#timeless'
    }
  }

  const docAsArticle = Document.create({
    ...sourceDoc,
    type: 'core/article'
  })
  const { document: prunedArticle } = await repository.pruneDocument(
    docAsArticle,
    accessToken
  )

  const newArticleId = crypto.randomUUID()
  const newArticle = Document.create({
    ...prunedArticle,
    uuid: newArticleId,
    uri: `core://article/${newArticleId}`,
    links: [
      ...prunedArticle.links,
      Block.create({
        type: 'core/article',
        uuid: sourceId,
        rel: 'source'
      })
    ]
  })

  const newPlanningId = crypto.randomUUID()
  let newPlanning: Document

  if (sourcePlanningId) {
    const sourcePlanningResponse = await repository.getDocument({
      uuid: sourcePlanningId,
      accessToken
    })
    if (!sourcePlanningResponse?.document) {
      return { statusCode: 404, statusMessage: 'Source planning not found' }
    }
    newPlanning = deriveNewPlanning({
      sourcePlanning: sourcePlanningResponse.document,
      targetDate,
      newUuid: newPlanningId
    })
  } else {
    newPlanning = planningDocumentTemplate(newPlanningId, {
      title: sourceDoc.title,
      query: { from: targetDate }
    })
  }

  const assignmentIso = isoDateTime ?? `${targetDate}T09:00:00Z`

  const articleConnection = await collaborationServer.server.openDirectConnection(
    newArticleId,
    context
  )
  await articleConnection.transact((document) => {
    toYjsNewsDoc(
      toGroupedNewsDoc({
        version: 0n,
        isMetaDocument: false,
        mainDocument: '',
        subset: [],
        document: newArticle
      }),
      document
    )
  })
  void articleConnection.disconnect().catch((ex: unknown) => {
    logger.error(ex, 'Failed disconnecting after article creation')
  })

  const articleSnapshot = await snapshot(
    collaborationServer,
    newArticleId,
    context,
    { addToHistory: true }
  )
  if ('statusMessage' in articleSnapshot) {
    return articleSnapshot
  }

  const planningConnection = await collaborationServer.server.openDirectConnection(
    newPlanningId,
    context
  )
  await planningConnection.transact((document) => {
    toYjsNewsDoc(
      toGroupedNewsDoc({
        version: 0n,
        isMetaDocument: false,
        mainDocument: '',
        subset: [],
        document: newPlanning
      }),
      document
    )

    const [index] = appendAssignment({
      document,
      type: 'text',
      title: sourceDoc.title,
      assignmentData: {
        public: 'true',
        start: assignmentIso,
        end: assignmentIso,
        start_date: targetDate,
        end_date: targetDate
      }
    })

    appendDocumentToAssignment({
      document,
      id: newArticleId,
      index,
      slug: '',
      type: 'article'
    })
  })
  void planningConnection.disconnect().catch((ex: unknown) => {
    logger.error(ex, 'Failed disconnecting after planning creation')
  })

  const planningSnapshot = await snapshot(
    collaborationServer,
    newPlanningId,
    context,
    { addToHistory: true }
  )
  // Partial failure: the article is already persisted but the planning isn't.
  // We leak the orphan articleId so the client/user can recover.
  if ('statusMessage' in planningSnapshot) {
    return {
      statusCode: planningSnapshot.statusCode,
      payload: {
        error: 'planning-creation-failed',
        articleId: newArticleId,
        message: planningSnapshot.statusMessage
      }
    }
  }

  // Mark the source timeless article as "used". Failures here are surfaced as
  // warnings rather than 500s: the new article and planning are already
  // committed, so rolling back the whole request would be strictly worse.
  const warnings: string[] = []
  try {
    await repository.bulkSaveMeta({
      statuses: [
        {
          uuid: sourceId,
          name: 'used',
          version: 0n
        }
      ],
      accessToken
    })
  } catch (ex: unknown) {
    logger.error(ex, `Failed marking source ${sourceId} as used after conversion`)
    warnings.push('source-not-marked-used')
  }

  return {
    statusCode: 200,
    payload: {
      articleId: newArticleId,
      planningId: newPlanningId,
      warnings
    }
  }
}
