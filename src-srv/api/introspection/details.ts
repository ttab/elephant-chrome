import type { RouteHandler } from '../../routes.js'


export const GET: RouteHandler = async (_, { collaborationServer }) => {
  try {
    return {
      payload: collaborationServer.getSnapshot()
    }
  } catch (ex) {
    return {
      statusCode: 500,
      statusMessage: 'Not authorized'
    }
  }
}
