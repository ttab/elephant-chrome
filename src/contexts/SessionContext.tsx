import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react'
import {
  SessionProvider as TTSessionProvider,
  useSession as useTTSession,
  type ClientSession,
  type SessionState,
  type SessionStatus,
  type TokenClient
} from '@ttab/tt-session/react'
import { claimsFromAccessToken } from '@/shared/sessionClaims'
import { tokenClient } from '@/shared/tokenClient'
import type { Session, SessionUser } from '@/types/session'

const BASE_PATH = `${import.meta.env.BASE_URL || ''}/api`
const IDENTITY_ENDPOINT = `${BASE_PATH}/session/me`

/**
 * Both are required by the identity endpoint, and neither is sufficient alone: a
 * same-origin `<img>` sends the first perfectly legitimately, and the second
 * alone would let in another tt.se subdomain. Spelled out rather than imported,
 * because the constants live on the package's server entrypoint.
 */
const SESSION_HEADER = 'x-tt-session'
const SESSION_HEADER_VALUE = '1'

/** How long to wait after a transient identity failure that named no delay. */
const IDENTITY_RETRY_MS = 5000

interface IdentityResponse {
  user: {
    sub: string
    email?: string
    name?: string
    givenName?: string
    familyName?: string
    preferredUsername?: string
    roles: string[]
    isAdmin: boolean
    scope: string
    customerId?: string
  }
  impersonating: {
    sub: string
    name?: string
    email?: string
    preferredUsername?: string
    customerId?: string
    isCustomerAdmin: boolean
    startedAt: number
    expiresAt: number
  } | null
}

interface SessionContextBase {
  /** Forces a token refetch and resolves once the new token is in hand. */
  update: () => Promise<SessionState>
  /**
   * True once the identity endpoint has answered at least once. The gate in
   * `SessionProvider` waits on it so a first paint never shows an empty name.
   */
  identityLoaded: boolean
}

/**
 * A discriminated union on `status`, so `if (status !== 'authenticated') return`
 * narrows `data` to non-null. The library's own context type does not do this,
 * but the invariant holds — `deriveStatus` only reports `authenticated` when a
 * session is actually held — and several call sites already depend on the
 * narrowing.
 */
export type SessionContextValue
  = | (SessionContextBase & {
    /** Named `data` to match what the call sites already destructure. */
    data: Session
    status: 'authenticated'
  })
  | (SessionContextBase & {
    data: null
    status: Exclude<SessionStatus, 'authenticated'>
  })

const SessionContext = createContext<SessionContextValue | null>(null)

export class MissingSessionProviderError extends Error {}

/**
 * `{ data, status, update }`, the shape the codebase already destructures.
 *
 * Throwing without a provider is deliberate: returning a null session instead
 * would make a forgotten provider look exactly like a signed-out user, and the
 * components that react to that navigate to Keycloak.
 */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)

  if (!value) {
    throw new MissingSessionProviderError('useSession() used outside a SessionProvider')
  }

  return value
}

/**
 * Composes the two halves of a client-rendered session.
 *
 * `@ttab/tt-session` splits them on purpose: the token endpoint answers
 * `{accessToken, expiresAt, subject, impersonating, scope}` and nothing else,
 * and identity — name, email, roles — comes from `/session/me`. `units` and the
 * full `org` URI are in neither, so they are read off the access token the
 * browser already holds.
 */
const SessionComposer = ({ children }: PropsWithChildren) => {
  const { data: tokenSession, status, update } = useTTSession()
  const [identity, setIdentity] = useState<IdentityResponse | null>(null)
  const [identityLoaded, setIdentityLoaded] = useState(false)

  // No first-fetch kick here on purpose: since 0.11.0 `SessionProvider` fetches
  // its own first token on mount when it has no `session` to seed from, which is
  // this app's case. `SessionContext.test.tsx` holds that contract.

  // Refetch identity when the subject changes or an impersonation starts or
  // stops — not on every token refresh, which happens once per token lifetime.
  const identityKey = tokenSession
    ? `${tokenSession.subject}:${String(tokenSession.impersonating)}`
    : null

  useEffect(() => {
    if (identityKey === null) {
      setIdentity(null)
      setIdentityLoaded(false)
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const retry = (delayMs: number): void => {
      if (cancelled) {
        return
      }

      timer = setTimeout(() => {
        void load()
      }, delayMs)
    }

    const load = async (): Promise<void> => {
      let response: Response

      try {
        response = await fetch(IDENTITY_ENDPOINT, {
          headers: { [SESSION_HEADER]: SESSION_HEADER_VALUE },
          credentials: 'same-origin'
        })
      } catch (error) {
        console.error(error)
        retry(IDENTITY_RETRY_MS)
        return
      }

      if (cancelled) {
        return
      }

      if (response.ok) {
        setIdentity(await response.json() as IdentityResponse)
        setIdentityLoaded(true)
        return
      }

      // A 401 is the token client's verdict to make, not ours — it is the only
      // thing allowed to conclude "signed out". But it reaches that verdict on
      // its own schedule, and it is still serving a cached token meanwhile, so
      // `status` stays `authenticated` while this stays unloaded: the gate would
      // then wait a whole token lifetime for a session that is already gone.
      // Forcing a refetch collapses that — it either yields a live token, or
      // flips the client to `unauthenticated` and shows the login screen.
      if (response.status === 401) {
        void update()
        retry(IDENTITY_RETRY_MS)
        return
      }

      if (response.status === 403) {
        console.error('tt-session identity request was not trusted — it must be same-origin and carry x-tt-session')
      }

      // Everything else retries. 429 and 503 are explicitly transient, and for
      // the rest retrying still beats the alternative: this gates the app's
      // loading screen, so any failure that does not retry is a permanent hang.
      // `>= 0` rather than `> 0`, matching the library's own `readTokenResponse`:
      // `Retry-After: 0` is a legitimate "retry now", not a malformed header.
      const retryAfter = Number.parseInt(response.headers.get('Retry-After') ?? '', 10)

      retry(Number.isFinite(retryAfter) && retryAfter >= 0
        ? retryAfter * 1000
        : IDENTITY_RETRY_MS)
    }

    void load()

    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [identityKey, update])

  const data = useMemo<Session | null>(
    () => composeSession(tokenSession, identity),
    [tokenSession, identity]
  )

  const value = useMemo<SessionContextValue>(
    // `data` is non-null exactly when the token client reports `authenticated`,
    // but that correlation lives in the library rather than in the types.
    () => ({ data, status, update, identityLoaded }) as SessionContextValue,
    [data, status, update, identityLoaded]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

function composeSession(
  tokenSession: ClientSession | null,
  identity: IdentityResponse | null
): Session | null {
  if (!tokenSession) {
    return null
  }

  const { units, org } = claimsFromAccessToken(tokenSession.accessToken)
  const principal = identity?.user

  const user: SessionUser = {
    sub: tokenSession.subject,
    id: tokenSession.subject,
    name: principal?.name ?? '',
    email: principal?.email ?? '',
    image: ''
  }

  return {
    accessToken: tokenSession.accessToken,
    accessTokenExpires: tokenSession.expiresAt,
    user,
    units,
    org,
    roles: principal?.roles ?? [],
    isAdmin: principal?.isAdmin ?? false,
    scope: tokenSession.scope,
    impersonating: identity?.impersonating ?? null
  }
}

/**
 * The token client, wrapping the composer.
 *
 * `refetchOnVisible` replaces next-auth's `refetchInterval`/`refetchOnWindowFocus`:
 * the client schedules its own refresh ahead of expiry with jitter, and a tab
 * becoming visible only costs a request when the token is actually near expiry.
 */
export const SessionClientProvider = ({ children, client = tokenClient }: PropsWithChildren<{
  /**
   * Defaults to the app-wide singleton. Overridable so a test can isolate one
   * render from another — the singleton would otherwise carry a session, or a
   * 401, from one test into the next. Mirrors the library's own `client` prop.
   */
  client?: TokenClient
}>) => (
  <TTSessionProvider client={client} refetchOnVisible>
    <SessionComposer>{children}</SessionComposer>
  </TTSessionProvider>
)

/**
 * The current access token, fetched only when the cached one is near expiry.
 *
 * Use this rather than reading `data.accessToken` when the token is needed
 * inside a callback: it never re-renders the caller.
 */
export function useAccessToken(): () => Promise<string | null> {
  const { data, update } = useSession()
  const accessToken = data?.accessToken
  const expiresAt = data?.accessTokenExpires

  return useCallback(async () => {
    if (accessToken && expiresAt && expiresAt - Date.now() > 60_000) {
      return accessToken
    }

    const state = await update()
    return state.session?.accessToken ?? null
  }, [accessToken, expiresAt, update])
}

export { SESSION_HEADER, SESSION_HEADER_VALUE, BASE_PATH as SESSION_BASE_PATH }
