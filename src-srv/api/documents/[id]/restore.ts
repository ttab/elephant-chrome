import type { Request } from 'express'
import type { RouteHandler } from '../../../routes.js'
import { isValidUUID } from '../../../utils/isValidUUID.js'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc.js'
import logger from '../../../lib/logger.js'
import { getContextFromValidSession } from '../../../lib/getContextFromValidSession.js'
import { assertContext } from '../../../lib/assertContext.js'
import { toYjsNewsDoc } from '@/shared/transformations/yjsNewsDoc.js'
import * as Y from 'yjs'

/**
 * Fetch latest (or specified) version of a document from the repository
 * and restores the collaborative state as well as the snapshot in redis
 * to the version fetched from the repository. Useful if the collaborative
 * state somehow gets corrupt.
 *
 * /api/documents/[uuid]/restore[?version=[nr]]
 */
export const POST: RouteHandler = async (req: Request, { collaborationServer, cache, repository, res }) => {
  const id = req.params.id
  const version = Number(req.query.version || '0')
  const { session } = res.locals

  const context = getContextFromValidSession(session as unknown)
  if (!assertContext(context)) {
    return context
  }

  if (!id || typeof id !== 'string' || !isValidUUID(id)) {
    return {
      statusCode: 400,
      statusMessage: 'Bad Request'
    }
  }

  try {
    // Fetch content from repository
    const doc = await repository.getDocument({
      uuid: id,
      accessToken: (session as { accessToken: string })?.accessToken,
      version
    }).catch((ex) => {
      throw new Error('get document from repository', { cause: ex })
    })

    if (!doc) {
      return {
        statusCode: 404,
        statusMessage: 'Not found'
      }
    }

    // Convert to groped NewsDoc
    const eleDoc = toGroupedNewsDoc(doc)

    const connection = await collaborationServer.server.openDirectConnection(id, context)

    await connection.transact((ydoc) => {
      // Clear the root Y.Map to ensure clean restore
      const map = ydoc.getMap('ele')
      Array.from(map.keys()).forEach((key) => map.delete(key))

      // Repopulate the collaborateive yjs document
      toYjsNewsDoc(eleDoc, ydoc)

      // Store updated snapshot in redis
      const update = Y.encodeStateAsUpdate(ydoc)
      const buffer = Buffer.from(update)
      cache.store(id, buffer).catch((ex) => {
        throw new Error('store documents state in redis', { cause: ex })
      })
    })

    return {
      payload: {
        version: eleDoc.version.toString(),
        document: eleDoc.document
      }
    }
  } catch (ex) {
    logger.error(ex)

    return {
      statusCode: 500,
      statusMessage: (ex as { message: string })?.message || 'Unknown error'
    }
  }
}
