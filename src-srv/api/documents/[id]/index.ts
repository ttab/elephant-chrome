import type { Request } from 'express'
import { getToken } from 'next-auth/jwt'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { fromGroupedNewsDoc, toGroupedNewsDoc } from '../../../utils/transformations/groupedNewsDoc.js'

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
    // Fetch from Redis if exists
    // const state = await cache.get(uuid).catch(ex => {
    //   throw new Error('get cached document', { cause: ex })
    // })

    // if (state) {
    //   const yDoc = new Y.Doc()
    //   Y.applyUpdate(yDoc, state)
    //   const doc = await yDocToNewsDoc(yDoc)

    //   return {
    //     payload: {
    //       ...doc,
    //       document: toGroupedNewsDoc(doc),
    //       version: doc.version.toString()
    //     }
    //   }
    // }

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

    const { document, version } = await fromGroupedNewsDoc(toGroupedNewsDoc(doc))

    return {
      payload: {
        version: version.toString(),
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
