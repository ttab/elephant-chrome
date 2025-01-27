import type { RouteHandler } from '../../routes.js'


export const GET: RouteHandler = async (_) => {
  const KEYCLOAK_URL = process.env.AUTH_KEYCLOAK_ISSUER || ''
  const AUTH_POST_LOGOUT_URI = process.env.AUTH_POST_LOGOUT_URI || 'https://tt.se'
  const AUTH_KEYCLOAK_ID = process.env.AUTH_KEYCLOAK_ID || 'elephant'

  if (!KEYCLOAK_URL) {
    return Promise.resolve({
      statusCode: 500,
      statusMessage: 'No logout url specified'
    })
  }

  const redirectUrl = new URL(KEYCLOAK_URL)

  redirectUrl.pathname += '/protocol/openid-connect/logout'

  redirectUrl.searchParams.append('client_id', AUTH_KEYCLOAK_ID)
  redirectUrl.searchParams.append('post_logout_redirect_uri', AUTH_POST_LOGOUT_URI)

  return Promise.resolve({
    statusCode: 302,
    statusMessage: redirectUrl.href
  })
}
