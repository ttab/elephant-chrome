import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import * as Y from 'yjs'
import logger from '../../../lib/logger.js'

import { type Context, isContext } from '../../../lib/context.js'
import { getValueByYPath, setValueByYPath } from '../../../../shared/yUtils.js'
import type { EleBlock } from '@/shared/types/index.js'
import { getSession } from '../../../lib/context.js'
import { snapshot } from '../../../utils/snapshot.js'

/**
 * Fetch a fresh document, either directly from Redis cache if it is there or from reposity if not,
 */
export const GET: RouteHandler = async (req: Request, { cache, repository, res }) => {
  const uuid = req.params.id
  const version = Number(req.query.version || '0')
  const type = req.query.type

  const { accessToken } = getSession(req, res)

  if (!accessToken) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Access token not found, can not fetch document'
    }
  }

  if (!uuid || typeof uuid !== 'string' || !isValidUUID(uuid)) {
    return {
      statusCode: 400,
      statusMessage: 'Bad Request'
    }
  }

  try {
    // Fetch from Redis if exists and no version specified
    if (!version) {
      const state = await cache.get(uuid).catch((ex) => {
        throw new Error('get cached document', { cause: ex })
      })

      // Check for collaborative/cached document
      if (state) {
        const yDoc = new Y.Doc()
        Y.applyUpdate(yDoc, state)
        const { documentResponse } = fromYjsNewsDoc(yDoc)

        // Return newsdoc from cache
        if (type === 'newsdoc') {
          return {
            payload: {
              from: 'cache',
              version: documentResponse.version.toString(),
              document: fromGroupedNewsDoc(documentResponse).document
            }
          }
        }

        // Return grouped newsdoc from cache
        return {
          payload: {
            from: 'cache',
            version: documentResponse.version.toString(),
            document: documentResponse.document
          }
        }
      }
    }

    // Fetch content fron repository
    const doc = await repository.getDocument({
      uuid,
      accessToken,
      version
    }).catch((ex) => {
      throw new Error('get document from repository', { cause: ex })
    })

    if (!doc) {
      return {
        statusCode: 404,
        statusMessage: 'Not found'
      }
    }

    const documentResponse = toGroupedNewsDoc(doc)

    // Return newsdoc from repository
    if (type === 'newsdoc') {
      return {
        payload: {
          from: 'repository',
          version: documentResponse.version.toString(),
          document: fromGroupedNewsDoc(documentResponse).document
        }
      }
    }

    // Return grouped newsdoc from repository
    return {
      payload: {
        from: 'repository',
        version: documentResponse.version.toString(),
        document: documentResponse.document
      }
    }
  } catch (ex) {
    logger.error(ex)

    return {
      statusCode: 500,
      statusMessage: (ex as { message: string })?.message || 'Unknown error'
    }
  }
}


/**
 * Patch method, make partial updates to a document.
 * Supported edits:
 * - Set publish time for withheld.
 * - Set start time for draft
 */
export const PATCH: RouteHandler = async (req: Request, { collaborationServer, res }) => {
  const { accessToken, user } = getSession(req, res)

  if (!accessToken || !user) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Session not found, can not snapshot document'
    }
  }

  // Validate incoming data
  const { assignment } = req.body as {
    assignment: {
      deliverableId: string
      type: string
      status: string
      time: string
    }
  }

  const id = req.params.id
  const {
    deliverableId,
    type: deliverableType,
    status,
    time
  } = assignment || {}

  if (!id || !assignment || !deliverableId || !deliverableType || !status || !time) {
    return {
      statusCode: 400,
      statusMessage: 'Invalid input to document PATCH method'
    }
  }

  const context: Context = {
    accessToken,
    user,
    agent: 'server'
  }

  if (!isContext(context)) {
    return {
      statusCode: 500,
      statusMessage: 'Invalid context provided'
    }
  }

  const connection = await collaborationServer.server.openDirectConnection(id, context)

  // Make the change to the document in one transaction
  await connection.transact((document) => {
    const yRoot = document.getMap('ele')
    const { index } = getAssignment(yRoot, deliverableId, deliverableType) || {}

    const base = `meta.core/assignment[${index}]`
    const [assignmentType] = getValueByYPath<string | undefined>(yRoot, `${base}.meta.core/assignment-type[0].value`)

    if (status === 'withheld') {
      // When scheduling we always set the publishTime to the given time
      setValueByYPath(yRoot, `${base}.data.publish`, time)
    } else if (assignmentType && ['text', 'flash', 'editorial-info'].includes(assignmentType)) {
      // If assignment type is text, flash or editorial info and the current start time is less
      // than the given time we bump the start time.
      const [currStartTime] = getValueByYPath<string | undefined>(yRoot, `${base}.data.start`)

      if (!currStartTime || (new Date(time) > new Date(currStartTime))) {
        setValueByYPath(yRoot, `${base}.data.start`, time)
      }
    }
  })

  await connection.disconnect()

  return snapshot(
    collaborationServer,
    id,
    context
  )
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
