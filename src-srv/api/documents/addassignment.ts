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

type Response = RouteContentResponse | RouteStatusResponse

/**
 * Patch method, make partial updates to a planning item.
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
  const { planningId, type, deliverableId, title, priority, publicVisibility, localDate, isoDateTime, publishTime } = req.body as {
    planningId?: string
    type: 'flash' | 'text'
    deliverableId: string
    title: string
    priority: number
    publicVisibility: boolean
    localDate: string
    isoDateTime: string
    publishTime: string
  }

  if (!type || !deliverableId || !title || !priority || !localDate || !isoDateTime || !publishTime) {
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
    if (!planningId) {
      // If we have no planningId we create a new planning item using
      // planningDocumentTemplate as a basis and apply it to the cocument.
      toYjsNewsDoc(
        toGroupedNewsDoc({
          version: 0n,
          isMetaDocument: false,
          mainDocument: '',
          document: planningDocumentTemplate(documentId, {
            meta: {
              'core/newsvalue': [Block.create({
                type: 'core/newsvalue',
                value: String(priority)
              })]
            }
          })
        }),
        document
      )
    }

    // Add the assignemnt to the planning item
    const index = appendAssignment({
      document,
      type,
      // slugLine needed for wire
      title,
      assignmentData: {
        publish: publishTime,
        public: publicVisibility ? 'true' : 'false',
        start: isoDateTime,
        end: isoDateTime,
        start_date: localDate,
        end_date: localDate
      }
    })

    // Append the deliverable to the assignment
    appendDocumentToAssignment({
      document,
      id: deliverableId,
      index,
      slug: '',
      type: getDeliverableType(type)
    })

    console.log('doc', JSON.stringify(document.toJSON(), null, 2))
    console.log('planningId', documentId)

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
