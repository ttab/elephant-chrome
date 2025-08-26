import logger from '../../../lib/logger.js'
import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { getContextFromValidSession, getSession, isContext } from '../../../lib/context.js'
import * as Y from 'yjs'

export const POST: RouteHandler = async (req: Request, { collaborationServer, res }) => {
  const id = req.params.id
  const status = req.query.status
  const cause = req.query.cause

  const payload = (req.body instanceof Buffer && req.body.length === 0)
    ? undefined
    : req.body as Uint8Array | undefined

  const context = getContextFromValidSession(getSession(req, res))
  if (!isContext(context)) {
    return context
  }

  try {
    // If we receive an update we apply it first
    if (payload instanceof Uint8Array) {
      const connection = await collaborationServer.server.openDirectConnection(id, context)

      await connection.transact((document) => {
        Y.applyUpdateV2(document, payload)
      })
      await connection.disconnect()
    }

    // Flush unsaved changes to the repository immediately
    const result = await collaborationServer.flushDocument(
      id,
      typeof status === 'string' ? status : null,
      typeof cause === 'string' ? cause : null,
      context
    )

    if (!result?.version) {
      throw new Error('Failed creating a new version')
    }

    return {
      statusCode: 200,
      payload: {
        uuid: id,
        version: result.version
      }
    }
  } catch (ex: unknown) {
    logger.error('Failed storing new version of document', ex)

    return {
      statusCode: 500,
      statusMessage: `Failed storing new version of document: ${(ex as Error).message || 'unknown reason'}`
    }
  }
}
