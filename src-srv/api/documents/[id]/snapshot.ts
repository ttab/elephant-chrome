import logger from '../../../lib/logger.js'
import type { Request } from 'express'
import type { RouteContentResponse, RouteHandler, RouteStatusResponse } from '../../../routes.js'
import { createSnapshot } from '../../../utils/createSnapshot.js'
import type { Session } from 'next-auth'
import { getContextFromValidSession, isContext, type Context } from '../../../lib/context.js'

type Response = RouteContentResponse | RouteStatusResponse

export const GET: RouteHandler = async (req: Request, { collaborationServer, cache, res }) => {
  const uuid = req.params.id
  const force = req.query.force

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

  const context = getContextFromValidSession(session)
  if (!isContext(context)) {
    return context
  }

  try {
    // Check if document exists in cache
    const state = await cache.get(uuid)
    if (!state) {
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
      createSnapshot(collaborationServer, {
        documentName: uuid,
        document,
        context,
        force: !!force
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
