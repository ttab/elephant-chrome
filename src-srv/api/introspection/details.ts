import type { RouteHandler } from '../../routes.js'


export const GET: RouteHandler = async (_, { collaborationServer }) => {
  try {
    return {
      payload: await collaborationServer.getSnapshot()
    }
  } catch (_ex) {
    return Promise.resolve({
      statusCode: 500,
      statusMessage: 'Not authorized'
    })
  }
}
