import type { Request } from 'express'
import type { RouteContentResponse, RouteHandler, RouteStatusResponse } from '../../routes.js'
import logger from '../../lib/logger.js'
import { Block } from '@ttab/elephant-api/newsdoc'
import { appendAssignment, appendDocumentToAssignment } from '../../../src/lib/createYItem.js'
import type { Context } from '../../lib/assertContext.js'
import { assertContext } from '../../lib/assertContext.js'
import { createSnapshot } from '../../utils/createSnapshot.js'
import { planningDocumentTemplate } from '../../../src/defaults/templates/planningDocumentTemplate.js'
import { getDeliverableType } from '../../../src/defaults/templates/lib/getDeliverableType.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import type { Wire } from '../../../src/hooks/index/useDocuments/schemas/wire.js'

type Response = RouteContentResponse | RouteStatusResponse

/**
 * Add assignment to an existing planning or a newly craeted one.
 */
export const POST: RouteHandler = async (req: Request, { collaborationServer, res }) => {
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: Context['user'] } | undefined

  if (!session?.accessToken || !session?.user) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Session not found, can not snapshot document'
    }
  }

  // Validate incoming data
  const {
    planningId,
    planningTitle,
    type,
    deliverableId,
    title,
    slugline,
    priority,
    publicVisibility,
    localDate,
    isoDateTime,
    publishTime,
    section,
    wire
  } = req.body as {
    planningId?: string
    planningTitle?: string
    type: 'flash' | 'text'
    deliverableId: string
    title: string
    slugline?: string
    priority?: number
    publicVisibility: boolean
    localDate: string
    isoDateTime: string
    publishTime?: string
    section?: {
      uuid: string
      title: string
    }
    wire?: Wire
  }

  if (!type || !deliverableId || !title || !localDate || !isoDateTime) {
    return {
      statusCode: 400,
      statusMessage: 'Invalid input to document addassignment endpoint'
    }
  }

  if (!planningId && (!section || !priority)) {
    return {
      statusCode: 400,
      statusMessage: 'Invalid input to document addassignment endpoint'
    }
  }

  const context: Context = {
    accessToken: session.accessToken,
    user: session.user,
    agent: 'server'
  }

  if (!assertContext(context)) {
    return {
      statusCode: 500,
      statusMessage: 'Invalid context provided'
    }
  }

  let response: Response = {
    statusCode: 500,
    statusMessage: ''
  }

  // Either request the document for the existing planning id
  // or use a new id to spawn a new Y.Doc.
  const documentId = planningId || crypto.randomUUID()
  const connection = await collaborationServer.server.openDirectConnection(documentId, context)

  await connection.transact((document) => {
    if (!planningId && section) {
      // If we have no planningId we create a new planning item using
      // planningDocumentTemplate as a basis and apply it to the cocument.
      toYjsNewsDoc(
        toGroupedNewsDoc({
          version: 0n,
          isMetaDocument: false,
          mainDocument: '',
          document: planningDocumentTemplate(documentId, {
            title: planningTitle || title,
            links: {
              'core/section': [Block.create({
                type: 'core/section',
                rel: 'section',
                uuid: section.uuid,
                title: section.title
              })]
            },
            meta: {
              'core/newsvalue': [Block.create({
                type: 'core/newsvalue',
                value: String(priority)
              })],
              ...(slugline
                ? {
                    'tt/slugline': [Block.create({
                      type: 'tt/slugline',
                      value: slugline
                    })]
                  }
                : {})
            }
          })
        }),
        document
      )
    }

    // Add the assignment to the planning item
    const assignmentData: Block['data'] = {
      public: publicVisibility ? 'true' : 'false',
      start: isoDateTime,
      end: isoDateTime,
      start_date: localDate,
      end_date: localDate
    }

    if (publishTime) {
      assignmentData.publish = publishTime
    }

    const index = appendAssignment({
      document,
      type,
      wire,
      slugLine: slugline,
      title,
      assignmentData
    })

    // Append the deliverable to the assignment
    appendDocumentToAssignment({
      document,
      id: deliverableId,
      index,
      slug: '',
      type: getDeliverableType(type)
    })

    response = {
      statusCode: 200,
      payload: {
        planningId: documentId
      }
    }
  })

  // Then we snapshot the document to the repository
  await new Promise<Response>((resolve) => {
    void connection.transact((document) => {
      createSnapshot(collaborationServer, {
        documentName: documentId,
        document,
        context,
        force: true
      })
        .then(resolve)
        .catch((ex: Error) => {
          const snapshotResponse = {
            statusCode: 500,
            statusMessage: `Error during snapshot transaction: ${ex.message || 'unknown reason'}`
          }

          logger.error(snapshotResponse.statusMessage, ex)
          resolve(snapshotResponse)
        })
    })
  })

  await connection.disconnect()

  return response
}
