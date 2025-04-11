import logger from '../../../lib/logger.js'
import type { Request } from 'express'
import type { RouteHandler, RouteStatusResponse } from '../../../routes.js'
import { assertContext } from '../../../lib/assertContext.js'

export const GET: RouteHandler = async (req: Request, { collaborationServer, cache, res }) => {
  const uuid = req.params.id
  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: unknown } | undefined

  if (!session) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Session not found, can not snapshot document'
    }
  }

  const context: unknown = {
    accessToken: session.accessToken,
    user: session.user,
    agent: 'server'
  }

  let snapshotResponse: RouteStatusResponse = {
    statusCode: 500,
    statusMessage: 'Unknown error'
  }


  try {
    // Check if document exists in cache
    const state = await cache.get(uuid)
    if (!state) {
      return {
        statusCode: 404,
        statusMessage: 'Document not found'
      }
    }


    const connection = await collaborationServer.server.openDirectConnection(uuid, context)

    await new Promise<void>((resolve, reject) => {
      connection.transact((document) => {
        if (!assertContext(context)) {
          throw new Error('Invalid context provided')
        }

        collaborationServer.snapshotDocument({
          documentName: uuid,
          document,
          context
        }).then((response) => {
          if (!response) {
            snapshotResponse = {
              statusCode: 200,
              statusMessage: 'Snapshot not deemed necessary'
            }
          } else if (response.status.code === 'OK') {
            snapshotResponse = {
              statusCode: 200,
              statusMessage: 'Snapshot taken'
            }
          } else {
            logger.error(`Error while taking snapshot: ${response.status.code}`)
          }

          // Resolve the promise after snapshotDocument completes
          resolve()
        }).catch((ex: Error) => {
          logger.error('Snapshot Error:', ex instanceof Error ? ex.message : ex)
          reject(ex) // Reject the promise on error
        })

        return undefined
      })
        .catch((ex: Error) => {
          logger.error('Error during transaction', ex)
          reject(ex)
        })
    })
  } catch (ex) {
    logger.error('Error while taking snapshot', { error: ex })
    return {
      statusCode: 500,
      statusMessage: 'Internal server error'
    }
  }

  return snapshotResponse
}
