import type { Request } from 'express'
import type { RouteHandler } from '../../../../routes.js'
import * as Y from 'yjs'
import logger from '../../../../lib/logger.js'

/**
 * Fetch a user tracker document from Redis cache
 */
export const GET: RouteHandler = async (req: Request, { cache }) => {
  const user = req.params.id

  try {
    // Fetch from Redis
    const state = await cache.get(user).catch((ex) => {
      throw new Error('get cached document', { cause: ex })
    })

    if (state) {
      const yDoc = new Y.Doc()
      Y.applyUpdate(yDoc, state)

      return {
        payload: yDoc.getMap('ele')
      }
    }

    return {
      statusCode: 404,
      statusMessage: 'Not Found'
    }
  } catch (ex) {
    logger.error(ex)

    return {
      statusCode: 500,
      statusMessage: (ex as { message: string })?.message || 'Unknown error'
    }
  }
}
