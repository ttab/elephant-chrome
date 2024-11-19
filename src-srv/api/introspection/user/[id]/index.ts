import type { Request } from 'express'
import type { RouteHandler } from '../../../../routes.js'
import { isValidUUID } from '../../../../utils/isValidUUID.js'
import * as Y from 'yjs'
import logger from '../../../../lib/logger.js'

/**
 * Fetch a user tracker document from Redis cache
 */
export const GET: RouteHandler = async (req: Request, { cache }) => {
  const uuid = req.params.id

  if (!uuid || typeof uuid !== 'string' || !isValidUUID(uuid)) {
    return {
      statusCode: 400,
      statusMessage: 'Bad Request'
    }
  }

  try {
    // Fetch from Redis
    const state = await cache.get(uuid).catch((ex) => {
      throw new Error('get cached document', { cause: ex })
    })

    if (state) {
      const yDoc = new Y.Doc()
      Y.applyUpdate(yDoc, state)

      return {
        payload: yDoc.getMap('ele')
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
