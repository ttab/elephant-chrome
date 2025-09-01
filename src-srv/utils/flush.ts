import type { CollaborationServer } from '../collaboration/CollaborationServer.js'
import type { Context } from '../lib/context.js'
import logger from '../lib/logger.js'
import type { RouteContentResponse, RouteStatusResponse } from '../routes.js'


export async function flush(
  collaborationServer: CollaborationServer,
  documentName: string,
  context: Context,
  options?: {
    status?: string
    cause?: string
    addToHistory?: boolean
  }
): Promise<RouteContentResponse | RouteStatusResponse> {
  try {
    const result = await collaborationServer.flushDocument(
      documentName,
      context,
      options
    )

    if (!result?.version) {
      throw new Error('Failed creating a new version')
    }

    return {
      statusCode: 200,
      payload: {
        uuid: documentName,
        version: result.version
      }
    }
  } catch (ex: unknown) {
    logger.error(ex, `Failed flushing changes to a new version of document ${documentName}`)

    return {
      statusCode: 500,
      statusMessage: `Failed storing new version of document: ${(ex as Error).message || 'unknown reason'}`
    }
  }
}
