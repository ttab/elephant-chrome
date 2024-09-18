import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { getToken } from 'next-auth/jwt'
import * as Y from 'yjs'
import { yDocToNewsDoc } from '../../../utils/transformations/yjs/yDoc.js'

/**
 * Fetch a fresh document, either directly from Redis cache if it is there or from reposity if not,
 */
export const GET: RouteHandler = async (req: Request, { cache, repository }) => {
  const uuid = req.params.id
  const secret = process.env.AUTH_SECRET

  if (typeof secret !== 'string') {
    return {
      statusCode: 400,
      statusMessage: 'Application error'
    }
  }

  // FIXME: req type error
  const { accessToken = undefined } = await getToken({ req, secret }) || {}
  if (!accessToken || typeof accessToken !== 'string') {
    return {
      statusCode: 403,
      statusMessage: 'Forbidden'
    }
  }

  if (!uuid || typeof uuid !== 'string' || !isValidUUID(uuid)) {
    return {
      statusCode: 400,
      statusMessage: 'Bad Request'
    }
  }

  try {
    // HACK: We need to provide a custom toJSON for BigInt to not trigger an Exception. Why? We don't need it elsewhere.
    // FIXME: This is not the way to do it!
    BigInt.prototype.toJSON = () => {
      return Number(this)
    }


    // Fetch from Redis if exists
    const state = await cache.get(uuid).catch(ex => {
      throw new Error('get cached document', { cause: ex })
    })

    if (state) {
      const yDoc = new Y.Doc()
      Y.applyUpdate(yDoc, state)
      return {
        payload: await yDocToNewsDoc(yDoc)
      }
    }

    // Fetch content fron repository
    const doc = await repository.getDoc({
      uuid,
      accessToken
    }).catch(ex => {
      throw new Error('get document from repository', { cause: ex })
    })

    return {
      payload: doc
    }
  } catch (ex) {
    console.error(ex)
    return {
      statusCode: 500,
      statusMessage: (ex as { message: string })?.message || 'Unknown error'
    }
  }
}
