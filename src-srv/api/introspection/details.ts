import type { RouteHandler } from '../../routes.js'


export const GET: RouteHandler = (_, { collaborationServer }) => {
  try {
    return Promise.resolve({
      payload: collaborationServer.getSnapshot()
    })
  } catch (_ex) {
    return Promise.resolve({
      statusCode: 500,
      statusMessage: 'Not authorized'
    })
  }
}
