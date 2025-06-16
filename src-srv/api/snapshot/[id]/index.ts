import logger from '../../../lib/logger.js'
import type { Request } from 'express'
import type { RouteContentResponse, RouteHandler, RouteStatusResponse } from '../../../routes.js'
import type { Context } from '../../../lib/assertContext.js'
import { assertContext } from '../../../lib/assertContext.js'
import { createSnapshot } from '../../../utils/createSnapshot.js'
import type { Session } from 'next-auth'
import * as Y from 'yjs'

type Response = RouteContentResponse | RouteStatusResponse

export const POST: RouteHandler = async (req: Request, { collaborationServer, cache, res }) => {
  const uuid = req.params.id
  const force = req.query.force
  const status = req.query.status
  const cause = req.query.cause

  const payload = (req.body instanceof Buffer && req.body.length === 0)
    ? undefined
    : req.body as Uint8Array | undefined

  // Get accessToken from request headers or session
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: Context['user'] } | undefined
  let accessToken = session?.accessToken
  if (!accessToken) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7)
    }
  }

  let user = session?.user
  if (!user) {
    const userHeader = req.headers['x-user'] || req.headers['X-User']
    if (typeof userHeader === 'string') {
      user = JSON.parse(userHeader) as Session['user']
    }
  }

  if (!accessToken || !user) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Session not found, can not snapshot document'
    }
  }

  const context: Context = {
    accessToken,
    user,
    agent: 'server'
  }

  if (!assertContext(context)) {
    return {
      statusCode: 500,
      statusMessage: 'Invalid context provided'
    }
  }

  try {
    // Check if document exists in cache
    const state = await cache.get(uuid)

    if (!state && !payload) {
      const notFoundMessage = `Document not found in cache: ${uuid}`
      logger.warn(notFoundMessage)

      return {
        statusCode: 200,
        statusMessage: notFoundMessage
      }
    }
  } catch (ex) {
    const exMessage = ex instanceof Error ? ex.message : JSON.stringify(ex)
    const cacheErrorMessage = `Error while getting cached document to snapshot: ${exMessage}`
    logger.error(cacheErrorMessage)

    return {
      statusCode: 500,
      statusMessage: cacheErrorMessage
    }
  }

  const connection = await collaborationServer.server.openDirectConnection(uuid, context)

  const snapshotResponse = await new Promise<Response>((resolve) => {
    void connection.transact((document) => {
      if (payload instanceof Uint8Array) {
        Y.applyUpdateV2(document, payload)
      }

      createSnapshot(collaborationServer, {
        documentName: uuid,
        document,
        context,
        force: !!force,
        status: typeof status === 'string' ? status : undefined,
        cause: typeof cause === 'string' ? cause : undefined
      })
        .then(resolve)
        .catch((ex: Error) => {
          const snapshotResponse = {
            statusCode: 500,
            statusMessage: `Error during snapshot transaction: ${ex.message || 'unknown reason'}`
          }

          logger.error(snapshotResponse.statusMessage, ex)
          resolve(snapshotResponse)
        })
    })
  })

  await connection.disconnect()

  return snapshotResponse
}
