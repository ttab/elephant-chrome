import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import { fromYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import * as Y from 'yjs'
import logger from '../../../lib/logger.js'

/**
 * Fetch a fresh document, either directly from Redis cache if it is there or from reposity if not,
 */
export const GET: RouteHandler = async (req: Request, { cache, repository, res }) => {
  const uuid = req.params.id
  const version = Number(req.query.version || '0')

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
      const { documentResponse } = fromYjsNewsDoc(yDoc)

      return {
        payload: documentResponse
      }
    }

    // Fetch content fron repository
    const doc = await repository.getDocument({
      uuid,
      accessToken: (session as { accessToken: string })?.accessToken,
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

    const { document, version: docVersion } = toGroupedNewsDoc(doc)

    return {
      payload: {
        version: docVersion,
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
