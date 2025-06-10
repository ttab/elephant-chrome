import type { RouteContentResponse, RouteStatusResponse } from '../routes.js'
import type * as Y from 'yjs'
import type { Context } from '../lib/assertContext.js'
import type { CollaborationServer } from '../utils/CollaborationServer.js'
import logger from '../lib/logger.js'

type Response = RouteContentResponse | RouteStatusResponse


export async function createSnapshot(collaborationServer: CollaborationServer, payload: {
  documentName: string
  document: Y.Doc
  context: Context
  force?: boolean
}): Promise<Response> {
  // FIXME: We should probably expose collaborationServer.#storeDocumentInRepository and call directly
  // FIXME: So we don't need to pass on transacting etc.
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
