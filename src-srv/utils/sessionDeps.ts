import { createClient } from 'redis'
import {
  RedisSessionStore,
  createSessionHandlers,
  createTokenRefresher,
  discoverOidcProvider,
  recommendedClientOptions,
  type OidcProvider,
  type SessionHandlers,
  type SessionStore,
  type TokenRefresher
} from '@ttab/tt-session'
import type pino from 'pino'

/**
 * Scopes elephant-chrome needs from Keycloak. `openid`, `profile` and `email`
 * are part of the library's own default scope but are listed here anyway so the
 * full grant is readable in one place.
 */
const SCOPES = [
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

/**
 * Which consumer owns the records this app creates. Read by `callbackHandler`,
 * and the reason a shared cookie cannot let another app destroy our session.
 */
const APP = 'elephant-chrome'

export interface SessionPaths {
  login: string
  callback: string
  logout: string
  token: string
  identity: string
}

export interface SessionDeps {
  session: SessionHandlers
  provider: OidcProvider
  store: SessionStore
  refresher: TokenRefresher
  secrets: readonly string[]
  ttlSeconds: number
  paths: SessionPaths
  namespace: string
  secure: boolean
  close: () => Promise<void>
}

export interface CreateSessionDepsOptions {
  logger: pino.Logger
  issuer: string
  clientId: string
  clientSecret: string
  /** Absolute public origin of the app, e.g. `https://tt.se`. */
  appOrigin: string
  /** Route prefix the session endpoints mount under, e.g. `/elephant/api`. */
  basePath: string
  redisUrl: string
  /** MAC secrets for the sid cookie, newest first. */
  secrets: readonly string[]
  ttlSeconds: number
  /** False only for local http development, which also drops `__Host-`. */
  secure: boolean
  /** Namespaces the cookie, so another TT app on the same host cannot take it over. */
  namespace: string
  idpHint?: string
  /**
   * Seam for tests: a `fakeKeycloak()` is reachable only through this. It has
   * to be an option here rather than something a test injects later, because
   * the provider is built once at boot.
   *
   * Typed off `discoverOidcProvider` rather than `typeof fetch` — openid-client
   * passes its own body types through, so the two are not assignable.
   */
  fetch?: NonNullable<Parameters<typeof discoverOidcProvider>[0]['fetch']>
  /**
   * Seam for tests: a `MemoryStore`, or `offlineStore()` to assert the degraded
   * paths. Omitted, a `RedisSessionStore` is built around a fresh client. Same
   * reasoning as `fetch` — the store is built once at boot, so a test cannot
   * substitute one afterwards.
   */
  store?: SessionStore
}

/**
 * The module-shared session foundation, built once per process.
 *
 * `discoverOidcProvider` makes a network call to the issuer, so building this
 * per request would add a round trip to every page view.
 */
export async function createSessionDeps(
  options: CreateSessionDepsOptions
): Promise<SessionDeps> {
  let close = async (): Promise<void> => {}
  let store = options.store

  if (!store) {
    const client = createClient({
      url: options.redisUrl,
      ...recommendedClientOptions
    })

    // Mandatory, not advisable. node-redis emits `error` on the client for every
    // failed connection attempt, and an EventEmitter with no `error` listener
    // rethrows it as an unhandled exception — which terminates the process. Log
    // and return: without this the replica dies on the first network blip instead
    // of degrading to an unauthenticated read, inverting the whole design.
    client.on('error', (err) => {
      options.logger.warn({ subsystem: 'session', err }, 'session redis error')
    })

    await client.connect().catch((ex) => {
      throw new Error('connect to session redis', { cause: ex })
    })

    store = new RedisSessionStore({ client })
    close = async () => {
      await client.close()
    }
  }

  const provider = await discoverOidcProvider({
    issuer: options.issuer,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    appOrigin: options.appOrigin,
    basePath: options.basePath,
    scope: SCOPES.join(' '),
    // Local development runs Keycloak discovery over plain http.
    allowInsecureRequests: !options.secure,
    ...(options.fetch ? { fetch: options.fetch } : {})
  }).catch((ex) => {
    throw new Error('discover OIDC provider', { cause: ex })
  })

  const refresher = createTokenRefresher(provider)

  // Bound once: `store`, `provider`, `secrets`, `namespace` and `secure` must be
  // identical across every route, and these are exactly the fields that drift
  // when each handler is configured separately.
  const session = createSessionHandlers({
    store,
    refresher,
    provider,
    secrets: options.secrets,
    ttlSeconds: options.ttlSeconds,
    app: APP,
    namespace: options.namespace,
    secure: options.secure
  })

  return {
    session,
    provider,
    store,
    refresher,
    secrets: options.secrets,
    ttlSeconds: options.ttlSeconds,
    namespace: options.namespace,
    secure: options.secure,
    paths: {
      login: provider.paths.login,
      callback: provider.paths.callback,
      logout: `${provider.basePath}/auth/logout`,
      token: `${provider.basePath}/session/token`,
      identity: `${provider.basePath}/session/me`
    },
    close
  }
}

/**
 * Authorization parameters applied to every login. `kc_idp_hint` has to travel
 * as an extra parameter — reserved parameters are applied afterwards and win,
 * so `extraParams` deliberately cannot rewrite `redirect_uri` or PKCE.
 */
export function loginAuthorizationParams(idpHint?: string): {
  extraParams?: Record<string, string>
} {
  return idpHint ? { extraParams: { kc_idp_hint: idpHint } } : {}
}
