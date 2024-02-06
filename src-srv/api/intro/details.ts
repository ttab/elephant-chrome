import type { RouteHandler } from '../../routes.js'


export const GET: RouteHandler = async (req, { collaborationServer, res }) => {
  try {
    return {
      payload: collaborationServer.getSnapshot()
    }
  } catch (ex) {
    return {
      statusCode: 401,
      statusMessage: 'Not authorized'
    }
  }
}
