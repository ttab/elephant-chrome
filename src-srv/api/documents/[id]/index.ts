import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { toGroupedNewsDoc } from '../../../utils/transformations/groupedNewsDoc.js'
import { fromYjsNewsDoc } from '../../../utils/transformations/yjsNewsDoc.js'
import * as Y from 'yjs'
import logger from '../../../lib/logger.js'

/**
 * Fetch a fresh document, either directly from Redis cache if it is there or from reposity if not,
 */
export const GET: RouteHandler = async (req: Request, { cache, repository, res }) => {
  const uuid = req.params.id

  const { session } = res.locals

  if (!uuid || typeof uuid !== 'string' || !isValidUUID(uuid)) {
    return {
      statusCode: 400,
      statusMessage: 'Bad Request'
    }
  }

  try {
    // Fetch from Redis if exists
    const state = await cache.get(uuid).catch((ex) => {
      throw new Error('get cached document', { cause: ex })
    })

    if (state) {
      const yDoc = new Y.Doc()
      Y.applyUpdate(yDoc, state)
      const { documentResponse } = await fromYjsNewsDoc(yDoc)

      return {
        payload: documentResponse
      }
    }

    // Fetch content fron repository
    const doc = await repository.getDocument({
      uuid,
      accessToken: session?.accessToken
    }).catch((ex) => {
      throw new Error('get document from repository', { cause: ex })
    })

    if (!doc) {
      return {
        statusCode: 404,
        statusMessage: 'Not found'
      }
    }

    const { document, version } = toGroupedNewsDoc(doc)

    return {
      payload: {
        version,
        document
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
