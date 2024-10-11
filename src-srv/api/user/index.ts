import { getToken, type JWT } from 'next-auth/jwt'
import type { Request } from 'express'
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

  // @ts-expect-error Mismatch between request param types
  const { accessToken = undefined, user } = await getToken({ req, secret }) || {}

  if (!accessToken || typeof accessToken !== 'string') {
    return {
      statusCode: 403,
      statusMessage: 'Forbidden'
    }
  }
  const typedUser = user as JWT

  try {
    if (!typedUser?.sub || typeof typedUser.sub !== 'string') {
      throw new Error('User not found')
    }

    const state = await cache.get(typedUser?.sub).catch(ex => {
      throw new Error('get cached document', { cause: ex })
    })

    if (!state) {
      throw new Error('User not found')
    }

    const yDoc = new Y.Doc()
    Y.applyUpdate(yDoc, state)


    return {
      payload: yDoc.getMap('documents')?.toJSON() || {}
    }
  } catch (ex) {
    return {
      statusCode: 500,
      statusMessage: (ex as { message: string })?.message || 'Unknown error'
    }
  }
}
