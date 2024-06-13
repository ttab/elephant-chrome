import { type AuthConfig } from '@auth/core'
import { type JWTPayload } from 'jose'
import Keycloak from '@auth/express/providers/keycloak'

const scopes = [
  'openid',
  'profile',
  'email',
  'search',
  'doc_read',
  'doc_write',
  'doc_delete'
]

const authorizationUrl = new URL(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/auth`)
authorizationUrl.searchParams.set('scope', scopes.join(' '))
if (process.env.AUTH_KEYCLOAK_IDP_HINT) {
  authorizationUrl.searchParams.set('kc_idp_hint', process.env.AUTH_KEYCLOAK_IDP_HINT)
}

async function refreshAccessToken(token: JWTPayload): Promise<JWTPayload> {
  const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`

  const params = new URLSearchParams({
    client_id: process.env.AUTH_KEYCLOAK_ID ?? '',
    client_secret: process.env.AUTH_KEYCLOAK_SECRET ?? '',
    grant_type: 'refresh_token',
    refresh_token: token.refreshToken as string ?? ''
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: params
  })

  const refreshedTokens = await response.json()

  if (!response.ok) {
    throw refreshedTokens
  }

  return {
    ...token,
    accessToken: refreshedTokens.access_token,
    accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
  }
}

export const authConfig: AuthConfig = {
  providers: [
    Keycloak({
      authorization: authorizationUrl.toString()
    })
  ],
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        ...token,
        user: {
          ...token.user as Record<string, unknown>,
          id: token.id as string
        },
        accessToken: token.accessToken,
        error: token.error
      }
    },
    async jwt({ token, user, account }) {
      // First time user is logging in
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_in || 300) * 1000,
          refreshToken: account.refresh_token,
          user
        }
      }

      // The user is already logged in, check if the access token is expired
      const accessTokenExpires = token.accessTokenExpires as number
      if (Date.now() < accessTokenExpires) {
        return token
      }

      // Access token is expired, refresh it
      return await refreshAccessToken(token)
    },
    redirect: async ({ url, baseUrl }) => {
      return await Promise.resolve(process.env.BASE_URL
        ? `${baseUrl}${process.env.BASE_URL}`
        : url)
    }
  }

}
