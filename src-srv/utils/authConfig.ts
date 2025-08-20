import { type AuthConfig } from '@auth/core'
import Keycloak from '@auth/express/providers/keycloak'
import { type JWT } from '@auth/core/jwt'
import type pino from 'pino'

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
  'content-api',
  'asset_upload'
]

export interface OidcConfig {
  token_endpoint: string
  jwks_uri: string
  end_session_endpoint: string
  authorization_endpoint: string
  userinfo_endpoint: string
}

export interface AuthInfo {
  authConfig: AuthConfig
  oidcConfig: OidcConfig
}

export async function createAuthInfo(
  logger: pino.Logger,
  providerUrl: string,
  clientID: string, clientSecret: string,
  idpHint?: string
): Promise<AuthInfo> {
  const oidcConf = await fetchOidcConfig(providerUrl).catch((e) => {
    throw new Error('fetch OIDC configuration', { cause: e })
  })

  const authorizationUrl = new URL(oidcConf.authorization_endpoint)

  authorizationUrl.searchParams.set('scope', scopes.join(' '))

  if (idpHint) {
    authorizationUrl.searchParams.set('kc_idp_hint', idpHint)
  }

  const auth = {
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
          return await refreshAccessToken(logger, oidcConf, token, clientID, clientSecret).catch((e) => {
            throw new Error('refresh access token', { cause: e })
          })
        }

        return token
      }
    },
    pages: {
      signIn: `${process.env.BASE_URL}/login`
    }
  } as AuthConfig

  return {
    oidcConfig: oidcConf,
    authConfig: auth
  }
}

async function fetchOidcConfig(provider: string): Promise<OidcConfig> {
  const resp = await fetch(`${provider}/.well-known/openid-configuration`).catch((e) => {
    throw new Error('make fetch request', { cause: e })
  })

  if (!resp.ok) {
    throw new Error(`error response from provider: ${resp.status} ${resp.statusText}`)
  }

  const config = await resp.json().catch((e) => {
    throw new Error('parse OIDC config', { cause: e })
  }) as OidcConfig

  return config
}

async function refreshAccessToken(
  logger: pino.Logger,
  conf: OidcConfig,
  token: JWT,
  clientID: string,
  clientSecret: string
): Promise<JWT> {
  try {
    const params = new URLSearchParams({
      client_id: clientID,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken as string ?? ''
    })

    const response = await fetch(conf.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body: params
    }).catch((e) => {
      throw new Error('fetch refresh token', { cause: e })
    })

    if (!response.ok) {
      throw new Error(`refresh request error response: ${response.statusText}`)
    }

    const refreshedTokens = await response.json().catch((e) => {
      throw new Error('parse refresh response', { cause: e })
    }) as unknown

    if (!isRefreshedTokens(refreshedTokens)) {
      throw new Error('refresh request error response: invalid token response')
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
    }
  } catch (ex) {
    logger.error({
      err: ex,
      sub: token.sub
    }, 'failed to refresh token')

    return { ...token, error: 'refreshAccessTokenError' }
  }
}

function isRefreshedTokens(value: unknown): value is JWT & { expires_in: number } {
  return typeof value === 'object' && value !== null
    && 'access_token' in value && typeof value.access_token === 'string'
    && 'expires_in' in value && typeof value.expires_in === 'number'
    && 'refresh_token' in value && typeof value.refresh_token === 'string'
}
