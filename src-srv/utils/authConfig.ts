import { type AuthConfig } from '@auth/core'
import Keycloak from '@auth/express/providers/keycloak'
import { type JWT } from '@auth/core/jwt'

const scopes = [
  'openid',
  'profile',
  'email',
  'search',
  'doc_read',
  'doc_write',
  'doc_delete',
  'eventlog_read',
  'metrics_read',
  'user',
  'baboon',
  'media',
  'content-api'
]

const authorizationUrl = new URL(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/auth`)
authorizationUrl.searchParams.set('scope', scopes.join(' '))
if (process.env.AUTH_KEYCLOAK_IDP_HINT) {
  authorizationUrl.searchParams.set('kc_idp_hint', process.env.AUTH_KEYCLOAK_IDP_HINT)
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
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

    if (!response.ok) {
      throw new Error(`refresh request error response: ${response.statusText}`)
    }

    const refreshedTokens = await response.json() as unknown

    if (!isRefreshedTokens(refreshedTokens)) {
      throw new Error('refresh request error response: invalid token response')
    }


    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
    }
  } catch (_ex) {
    return { ...token, error: 'refreshAccessTokenError' }
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
      return Promise.resolve({
        ...session,
        ...token
      })
    },
    async jwt({ token, user, account }) {
      // First time user is logging in
      if (account && user) {
        if (account.access_token) {
          // @ts-expect-error sub exists
          user.sub = account.providerAccountId
        }
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + (account.expires_in || 300) * 1000,
          refreshToken: account.refresh_token,
          user
        }
      }

      // The user is already logged in, check if the access token is expired
      // We want to refresh with 150 seconds left
      const accessTokenExpires = (Number(token.accessTokenExpires) || 0) - 150 * 1000
      const remaining = accessTokenExpires - Date.now()
      if (remaining < 0) {
        return await refreshAccessToken(token)
      }

      return token
    }
  },
  pages: {
    signIn: `${process.env.BASE_URL}/login`
  }
}

function isRefreshedTokens(value: unknown): value is JWT & { expires_in: number } {
  return typeof value === 'object' && value !== null
    && 'access_token' in value && typeof value.access_token === 'string'
    && 'expires_in' in value && typeof value.expires_in === 'number'
    && 'refresh_token' in value && typeof value.refresh_token === 'string'
}
