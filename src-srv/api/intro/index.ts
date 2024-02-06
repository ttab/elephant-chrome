import type { RouteHandler } from '../../routes.js'


export const GET: RouteHandler = async (req, { collaborationServer }) => {
  try {
    return {
      payload: {
        connections: collaborationServer.getConnectionsCount(),
        documents: collaborationServer.getDocumentsCount()
      }
    }
  } catch (ex) {
    return {
      statusCode: 401,
      statusMessage: 'Not authorized'
    }
  }
}
