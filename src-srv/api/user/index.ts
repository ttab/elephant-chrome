import { getToken } from 'next-auth/jwt'
import type { RouteHandler } from '../../routes.js'
import * as Y from 'yjs'

export const GET: RouteHandler = async (req: Request, { cache }) => {
  const secret = process.env.AUTH_SECRET

  if (typeof secret !== 'string') {
    return {
      statusCode: 400,
      statusMessage: 'Application error'
    }
  }

  const { accessToken = undefined, user } = await getToken({ req, secret }) || {}
  if (!accessToken || typeof accessToken !== 'string') {
    return {
      statusCode: 403,
      statusMessage: 'Forbidden'
    }
  }

  try {
    // Fetch from Redis if exists
    if (!user?.sub) {
      throw new Error('User not found')
    }

    const state = await cache.get(user?.sub).catch(ex => {
      throw new Error('get cached document', { cause: ex })
    })

    if (state) {
      const yDoc = new Y.Doc()
      Y.applyUpdate(yDoc, state)


      return {
        payload: yDoc.getMap('documents')?.toJSON() || {}
      }
    }
  } catch (err) {
    console.error(err)
  }
}
