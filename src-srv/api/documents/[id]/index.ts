import type { Request } from 'express'
import { getToken } from 'next-auth/jwt'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { toGroupedNewsDoc } from '../../../utils/transformations/groupedNewsDoc.js'
import { fromYjsNewsDoc } from '../../../utils/transformations/yjsNewsDoc.js'
import * as Y from 'yjs'

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

  // @ts-expect-error Mismatch between request param types
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
    // Fetch from Redis if exists
    const state = await cache.get(uuid).catch(ex => {
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
    const doc = await repository.getDoc({
      uuid,
      accessToken
    }).catch(ex => {
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
    console.error(ex)

    return {
      statusCode: 500,
      statusMessage: (ex as { message: string })?.message || 'Unknown error'
    }
  }
}
