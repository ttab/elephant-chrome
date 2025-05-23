import type { Request } from 'express'
import type { RouteContentResponse, RouteHandler, RouteStatusResponse } from '../../routes.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import logger from '../../lib/logger.js'
import { Block } from '@ttab/elephant-api/newsdoc'
import * as Templates from '@/shared/templates/index.js'

import type { Context } from '../../lib/assertContext.js'
import { assertContext } from '../../lib/assertContext.js'
import { getValueByYPath, setValueByYPath } from '../../../shared/yUtils.js'
import type { EleBlock } from '@/shared/types/index.js'
import { createSnapshot } from '../../utils/createSnapshot.js'

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

  // Either request the document for the existing planning id or use a new id to spawn a new Y.Doc
  const documentId = planningId || crypto.randomUUID()
  const connection = await collaborationServer.server.openDirectConnection(documentId, context)

  // Make the change to the planning document in one transaction
  await connection.transact((document) => {
    if (!planningId) {
      // We had no planningId, we need to create the whole document
      // How do we merge it...?
      const newDoc = toYjsNewsDoc(
        toGroupedNewsDoc({
          version: 0n,
          isMetaDocument: false,
          mainDocument: '',
          document: Templates.planning(documentId,
            {
              meta: {
                'core/newsvalue': [Block.create({ type: 'core/newsvalue', value: String(priority) })]
              }
            })
        }),
        document
      )
    }

    const yRoot = document.getMap('ele')

    response = {
      statusCode: 200,
      payload: {}
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


function getAssignment(yRoot: Y.Map<unknown>, deliverableId: string, deliverableType: string) {
  const [assignments] = getValueByYPath<EleBlock[]>(yRoot, 'meta.core/assignment')

  for (let i = 0; i < (assignments?.length || 0); i++) {
    if (assignments?.[i].links?.[deliverableType]?.[0].uuid === deliverableId) {
      return {
        assignmentId: assignments[i].id,
        index: i
      }
    }
  }

  return undefined
}
