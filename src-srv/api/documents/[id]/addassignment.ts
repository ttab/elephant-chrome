import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { Block } from '@ttab/elephant-api/newsdoc'
import { appendAssignment, appendDocumentToAssignment } from '../../../../shared/createYItem.js'
import { planningDocumentTemplate } from '@/shared/templates/planningDocumentTemplate.js'
import { getDeliverableType } from '@/shared/templates/lib/getDeliverableType.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import type { Wire } from '@/shared/schemas/wire.js'
import { getContextFromValidSession, isContext, type Context } from '../../../lib/context.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { flush } from '../../../utils/flush.js'

/**
 * Add assignment to an existing planning or a newly created one.
 */
export const POST: RouteHandler = async (req: Request, { collaborationServer, res }) => {
  const planningId = req.params.id
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: Context['user'] } | undefined

  const context = getContextFromValidSession(session)
  if (!isContext(context)) {
    return context
  }

  // Validate incoming data
  const {
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

  // Either request the document for the existing planning id
  // or use a new id to spawn a new Y.Doc. Validate that planningId is a valid UUID.
  const documentId = (isValidUUID(planningId) && planningId) || crypto.randomUUID()
  const connection = await collaborationServer.server.openDirectConnection(documentId, context)

  await connection.transact((document) => {
    if (!isValidUUID(planningId) && section) {
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
  })

  await connection.disconnect()

  return flush(
    collaborationServer,
    documentId,
    context
  )
}
