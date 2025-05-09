import logger from '../../../lib/logger.js'
import type { Request } from 'express'
import type { RouteContentResponse, RouteHandler, RouteStatusResponse } from '../../../routes.js'
import type { Context } from '../../../lib/assertContext.js'
import { assertContext } from '../../../lib/assertContext.js'
import type { CollaborationServer } from '../../../utils/CollaborationServer.js'
import type * as Y from 'yjs'

type Response = RouteContentResponse | RouteStatusResponse

export const GET: RouteHandler = async (req: Request, { collaborationServer, cache, res }) => {
  const uuid = req.params.id
  const force = req.query.force

  const locals = res.locals as Record<string, unknown> | undefined
  const session = locals?.session as { accessToken?: string, user?: Context['user'] } | undefined

  if (!session?.accessToken || !session?.user) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Session not found, can not snapshot document'
    }
  }

  const context: Context = {
    accessToken: session.accessToken,
    user: session.user,
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


async function createSnapshot(collaborationServer: CollaborationServer, payload: {
  documentName: string
  document: Y.Doc
  context: Context
  force?: boolean
}): Promise<Response> {
  const response = await collaborationServer.snapshotDocument({
    ...payload,
    transacting: true
  })

  if (!response) {
    return {
      statusCode: 200,
      statusMessage: 'Snapshot not necessary'
    }
  }

  if (response.status.code !== 'OK') {
    const statusMessage = `Error while taking snapshot: ${response.status.code}`
    logger.error(statusMessage)

    return {
      statusCode: 500,
      statusMessage
    }
  }

  return {
    statusCode: 200,
    payload: {
      uuid: response.response.uuid,
      version: response.response.version.toString()
    }
  }
}
