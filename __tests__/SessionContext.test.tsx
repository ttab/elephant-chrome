import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TokenClient } from '@ttab/tt-session/react'
import { SessionClientProvider, useSession } from '@/contexts/SessionContext'

// The global setup mocks this module for every other suite; this one is about
// the real implementation.
vi.unmock('@/contexts/SessionContext')

const TOKEN_ENDPOINT = '/elephant/api/session/token'

const b64 = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url')

/** An access token carrying the TT claims, which only exist there. */
const accessToken = [
  b64({ alg: 'RS256', typ: 'JWT' }),
  b64({ sub: 'core://user/5558', units: ['/redaktionen-npk'], org: 'core://org/tt' }),
  'signature-not-verified'
].join('.')

const tokenBody = {
  accessToken,
  expiresAt: Date.now() + 900_000,
  subject: 'core://user/5558',
  impersonating: false,
  scope: 'openid email profile'
}

const identityBody = {
  user: {
    sub: 'core://user/5558',
    name: 'Testy Test',
    email: 'testy.test@example.com',
    roles: ['ROLE_TT'],
    isAdmin: true,
    scope: 'openid email profile'
  },
  impersonating: null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

const urlOf = (input: RequestInfo | URL): string => {
  if (input instanceof URL) {
    return input.href
  }

  return typeof input === 'string' ? input : input.url
}

/** A `fetch` that routes on the path, so a test only states what it answers. */
function stubFetch(handler: (url: string) => Response): typeof globalThis.fetch {
  return vi.fn(
    (input: RequestInfo | URL) => Promise.resolve(handler(urlOf(input)))
  ) as unknown as typeof globalThis.fetch
}

/** The happy path: both endpoints answer. */
function stubBothEndpoints(): typeof globalThis.fetch {
  return stubFetch((url) => {
    if (url.endsWith('/session/token')) {
      return json(tokenBody)
    }

    if (url.endsWith('/session/me')) {
      return json(identityBody)
    }

    throw new Error(`unexpected fetch: ${url}`)
  })
}

const Probe = () => {
  const { data, status, identityLoaded } = useSession()

  return (
    <div>
      <span data-testid='status'>{status}</span>
      <span data-testid='identity-loaded'>{String(identityLoaded)}</span>
      <span data-testid='name'>{data?.user.name ?? ''}</span>
      <span data-testid='sub'>{data?.user.sub ?? ''}</span>
      <span data-testid='units'>{(data?.units ?? []).join(',')}</span>
      <span data-testid='org'>{data?.org ?? ''}</span>
    </div>
  )
}

/** A client whose fetches are isolated from the app-wide singleton. */
function client(fetchImpl: typeof globalThis.fetch): TokenClient {
  return new TokenClient({ endpoint: TOKEN_ENDPOINT, fetch: fetchImpl })
}

describe('SessionContext', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /**
   * Pins the contract this app depends on: with no server render to seed from,
   * mounting the provider must produce a token fetch by itself.
   *
   * `TokenClient.start()` used to only arm a refresh timer for a session it
   * already held, so before 0.11.0 this app issued no first request at all and
   * sat on `loading` for ever behind its own "Fetching session…" gate — no
   * error, no network call, just an app that never finished loading. The
   * library self-starts now; this test is what tells us if that ever regresses,
   * since the symptom is silent.
   */
  it('fetches the session on mount without a server-rendered seed', async () => {
    const fetchImpl = stubBothEndpoints()

    vi.stubGlobal('fetch', fetchImpl)

    render(
      <SessionClientProvider client={client(fetchImpl)}>
        <Probe />
      </SessionClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    })

    expect(screen.getByTestId('sub').textContent).toBe('core://user/5558')
  })

  it('composes identity from /session/me and TT claims from the access token', async () => {
    const fetchImpl = stubBothEndpoints()

    vi.stubGlobal('fetch', fetchImpl)

    render(
      <SessionClientProvider client={client(fetchImpl)}>
        <Probe />
      </SessionClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('identity-loaded').textContent).toBe('true')
    })

    // Name and email exist only on the identity endpoint.
    expect(screen.getByTestId('name').textContent).toBe('Testy Test')
    // units and the full org URI exist only on the access token.
    expect(screen.getByTestId('units').textContent).toBe('/redaktionen-npk')
    expect(screen.getByTestId('org').textContent).toBe('core://org/tt')
  })

  it('reports unauthenticated on a 401 from the token endpoint', async () => {
    const fetchImpl = stubFetch(() => json({ error: 'unauthenticated' }, 401))

    vi.stubGlobal('fetch', fetchImpl)

    render(
      <SessionClientProvider client={client(fetchImpl)}>
        <Probe />
      </SessionClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
    })
  })

  /**
   * The rule the whole design rests on: only a 401 may sign anyone out. A
   * degraded store must leave the UI waiting, not eject the user.
   */
  it('stays loading rather than signing out when the store is degraded', async () => {
    const fetchImpl = stubFetch(() => new Response(null, {
      status: 503,
      headers: { 'retry-after': '5' }
    }))

    vi.stubGlobal('fetch', fetchImpl)

    render(
      <SessionClientProvider client={client(fetchImpl)}>
        <Probe />
      </SessionClientProvider>
    )

    await waitFor(() => {
      expect(fetchImpl).toHaveBeenCalled()
    })

    expect(screen.getByTestId('status').textContent).toBe('loading')
  })

  /**
   * A session that has expired out from under a cached token: the identity
   * endpoint says 401 while the token client is still serving what it holds. It
   * must not leave the gate waiting for the next scheduled refresh — the same
   * silent-forever-wait shape as the bug above.
   */
  it('resolves rather than waiting when identity 401s under a cached token', async () => {
    let tokenCalls = 0

    const fetchImpl = stubFetch((url) => {
      if (url.endsWith('/session/token')) {
        tokenCalls += 1

        // Good on the first poll, gone by the time anyone asks again.
        return tokenCalls === 1 ? json(tokenBody) : json({ error: 'unauthenticated' }, 401)
      }

      if (url.endsWith('/session/me')) {
        return json({ error: 'unauthenticated' }, 401)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchImpl)

    render(
      <SessionClientProvider client={client(fetchImpl)}>
        <Probe />
      </SessionClientProvider>
    )

    // Ends at the login screen rather than sitting on the loading gate.
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated')
    }, { timeout: 5000 })

    expect(tokenCalls).toBeGreaterThan(1)
  })

  /**
   * The identity fetch gates the app's loading screen, so a failure that never
   * retries is a permanent hang — the same shape as the bug above.
   */
  it('retries the identity endpoint until it answers', async () => {
    let identityCalls = 0

    const fetchImpl = stubFetch((url) => {
      if (url.endsWith('/session/token')) {
        return json(tokenBody)
      }

      if (url.endsWith('/session/me')) {
        identityCalls += 1

        // A degraded first answer, then a good one.
        return identityCalls === 1
          ? new Response(null, { status: 503, headers: { 'retry-after': '0' } })
          : json(identityBody)
      }

      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchImpl)

    render(
      <SessionClientProvider client={client(fetchImpl)}>
        <Probe />
      </SessionClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('identity-loaded').textContent).toBe('true')
    }, { timeout: 5000 })

    expect(identityCalls).toBeGreaterThan(1)
    expect(screen.getByTestId('name').textContent).toBe('Testy Test')
  })
})
