import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import type { Document } from '@ttab/elephant-api/newsdoc'
import {
  appendAssignment,
  appendDocumentToAssignment
} from '../../../../shared/createYItem.js'
import {
  buildFallbackPlanning,
  deriveNewPlanning,
  prepareArticleConversion
} from '@/shared/convertArticleType.js'
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

function planningReferencesArticle(planning: Document, articleId: string): boolean {
  return planning.meta.some((block) =>
    block.type === 'core/assignment'
    && block.links.some((link) => link.rel === 'deliverable' && link.uuid === articleId)
  )
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

  try {
    const sourceResponse = await repository.getDocument({
      uuid: sourceId,
      accessToken
    }).catch((ex: unknown) => {
      throw new Error(`fetch source document ${sourceId}`, { cause: ex })
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

    const {
      newDocument: newArticle,
      errors: pruneErrors
    } = await prepareArticleConversion(
      sourceDoc,
      'core/article',
      repository,
      accessToken
    ).catch((ex: unknown) => {
      throw new Error(`prune source document ${sourceId}`, { cause: ex })
    })
    const newArticleId = newArticle.uuid
    if (pruneErrors.length > 0) {
      logger.warn(
        { sourceId, errors: pruneErrors },
        'Prune validation warnings during timeless→article conversion'
      )
    }

    const newPlanningId = crypto.randomUUID()
    let newPlanning: Document

    if (sourcePlanningId) {
      const sourcePlanningResponse = await repository.getDocument({
        uuid: sourcePlanningId,
        accessToken
      }).catch((ex: unknown) => {
        throw new Error(`fetch source planning ${sourcePlanningId}`, { cause: ex })
      })
      if (!sourcePlanningResponse?.document) {
        return { statusCode: 404, statusMessage: 'Source planning not found' }
      }
      if (!planningReferencesArticle(sourcePlanningResponse.document, sourceId)) {
        return {
          statusCode: 400,
          statusMessage: 'sourcePlanningId does not reference the source article'
        }
      }
      newPlanning = deriveNewPlanning({
        sourcePlanning: sourcePlanningResponse.document,
        targetDate,
        newUuid: newPlanningId
      })
    } else {
      newPlanning = buildFallbackPlanning({
        newUuid: newPlanningId,
        title: sourceDoc.title,
        targetDate
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
      // Article has been committed to Yjs but snapshot failed. Surface the
      // articleId so the client can mark it as an orphan and let the user
      // recover, matching the planning-failure contract below.
      logger.error(
        { articleId: newArticleId, statusMessage: articleSnapshot.statusMessage },
        'Article snapshot failed after Yjs commit'
      )
      return {
        statusCode: articleSnapshot.statusCode,
        payload: {
          error: 'article-snapshot-failed',
          articleId: newArticleId,
          message: articleSnapshot.statusMessage
        }
      }
    }

    // Partial failure: the article is already persisted but the planning isn't.
    // Any rejection from the planning phase must still surface the orphan
    // articleId so the client/user can recover, rather than bubbling to the
    // top-level handler (which returns an empty 500 body).
    try {
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
    } catch (ex: unknown) {
      logger.error(ex, `Planning creation failed after article ${newArticleId} was committed`)
      return {
        statusCode: 500,
        payload: {
          error: 'planning-creation-failed',
          articleId: newArticleId,
          message: ex instanceof Error ? ex.message : 'Unknown error'
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
            version: sourceResponse.version
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
  } catch (ex: unknown) {
    // Repository failures and other unexpected errors in the pre-commit phase
    // land here. Without this the handler would reject and Express would
    // return an empty 500 body. Post-commit branches already produce their
    // own structured responses (including articleId) and return before this.
    logger.error(ex, `convertToArticle failed for source ${sourceId}`)
    return {
      statusCode: 500,
      statusMessage: ex instanceof Error ? ex.message : 'Unknown error'
    }
  }
}
