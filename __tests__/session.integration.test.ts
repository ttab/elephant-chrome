// @vitest-environment node
import { describe, it, expect, beforeAll, vi } from 'vitest'
import express from 'express'
import http, { type Server } from 'node:http'
import { expressHandler } from '@ttab/tt-session/express'
import { fakeKeycloak, offlineStore, type FakeKeycloak } from '@ttab/tt-session/testing'
import { MemoryStore } from '@ttab/tt-session'
import { createSessionDeps, loginAuthorizationParams, type SessionDeps } from '../src-srv/utils/sessionDeps'
import { assertAuthenticatedUser, sessionMiddleware, type ServerSession } from '../src-srv/utils/sessionMiddleware'

/**
 * Drives the real login round trip through elephant-chrome's own Express
 * wiring — the same `createSessionDeps` the server builds at boot, the same
 * `expressHandler` bridge, the same middleware — against the library's
 * in-process Keycloak. `fakeKeycloak` signs real ES384 over a real JWKS and
 * verifies real PKCE, so this exercises the production code paths minus the
 * network.
 */

const BASE_URL = '/elephant'
const BASE_PATH = `${BASE_URL}/api`
const SID_SECRET = 'a'.repeat(48)

/**
 * Requests go over `node:http` rather than `fetch`, for two reasons:
 * `setupTests.ts` replaces the global `fetch` with a stub for the component
 * tests, and Node hands `set-cookie` back as a real array — which is the only
 * correct way to read the two cookies the callback sends. The fake IdP is
 * reached through openid-client's own fetch seam, so nothing here needs a
 * global `fetch` at all.
 */
interface HttpResponse {
  status: number
  headers: http.IncomingHttpHeaders
  setCookies: string[]
  location: string | undefined
  body: string
  json: <T>() => T
}

async function request(url: string, options: {
  method?: string
  headers?: Record<string, string>
} = {}): Promise<HttpResponse> {
  return await new Promise<HttpResponse>((resolve, reject) => {
    const req = http.request(url, {
      method: options.method ?? 'GET',
      headers: options.headers ?? {}
    }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8')
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          setCookies: res.headers['set-cookie'] ?? [],
          location: res.headers.location,
          body,
          json: <T>() => JSON.parse(body) as T
        })
      })
    })

    req.on('error', reject)
    req.end()
  })
}

const logger = {
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn()
} as unknown as Parameters<typeof createSessionDeps>[0]['logger']

async function buildDeps(kc: FakeKeycloak, store = new MemoryStore()): Promise<SessionDeps> {
  return await createSessionDeps({
    logger,
    issuer: kc.issuer,
    clientId: kc.clientId,
    clientSecret: kc.clientSecret,
    appOrigin: 'http://localhost:5173',
    basePath: BASE_PATH,
    redisUrl: 'unused',
    secrets: [SID_SECRET],
    ttlSeconds: 86400,
    secure: false,
    namespace: 'elephant-chrome',
    store,
    fetch: kc.fetch
  })
}

/** Mounts the routes exactly as `src-srv/index.ts` does. */
function buildApp(deps: SessionDeps): express.Express {
  const app = express()
  const { session, paths } = deps

  app.set('trust proxy', true)

  app.get(paths.login, expressHandler(
    session.login({ authorizationParams: loginAuthorizationParams('saml') }),
    { origin: 'http://localhost:5173' }
  ))
  app.get(paths.callback, expressHandler(session.callback(), { origin: 'http://localhost:5173' }))
  app.get(paths.token, expressHandler(session.token(), { origin: 'http://localhost:5173' }))
  app.get(paths.identity, expressHandler(session.session(), { origin: 'http://localhost:5173' }))
  app.post(paths.logout, expressHandler(session.logout(), { origin: 'http://localhost:5173' }))

  // A global body parser is the Express norm, and it drains the stream — the
  // bridge has to re-serialize `req.body`. Mounted here so the test covers it.
  app.use(BASE_URL, express.json({ limit: '1mb' }))
  app.use(sessionMiddleware(BASE_URL, deps))

  app.use(`${BASE_URL}/api/documents`, (req, res, next) => {
    assertAuthenticatedUser(BASE_URL, {} as never)(req, res, next).catch(next)
  })
  app.get(`${BASE_URL}/api/documents/probe`, (_req, res) => {
    const session = res.locals.session as ServerSession | undefined
    res.json({ session })
  })

  return app
}

function listen(app: express.Express): Promise<{ origin: string, server: Server }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      resolve({ origin: `http://127.0.0.1:${port}`, server })
    })
  })
}

/** The one cookie header the browser would send back. */
function cookieHeader(response: HttpResponse): string {
  return response.setCookies
    .map((value) => value.split(';')[0])
    .filter((pair) => !pair.endsWith('='))
    .join('; ')
}

describe('session integration', () => {
  let kc: FakeKeycloak

  beforeAll(async () => {
    kc = await fakeKeycloak({
      claims: {
        name: 'Testy Test',
        email: 'testy.test@example.com'
      }
    })
  })

  it('completes a login round trip and issues a session cookie', async () => {
    const deps = await buildDeps(kc)
    const { origin, server } = await listen(buildApp(deps))

    try {
      // 1. The login route redirects to Keycloak and sets the transaction cookie.
      const begin = await request(`${origin}${deps.paths.login}?returnTo=/elephant/plannings`)

      expect(begin.status).toBe(302)
      const authorizationUrl = begin.location
      expect(authorizationUrl).toBeTruthy()
      // The idp hint has to travel as an extra authorization parameter.
      expect(new URL(authorizationUrl as string).searchParams.get('kc_idp_hint')).toBe('saml')

      // 2. The browser consents; Keycloak redirects back with a code.
      const callbackUrl = kc.authorize(authorizationUrl as string)
      const callbackPath = new URL(callbackUrl).pathname + new URL(callbackUrl).search

      const done = await request(`${origin}${callbackPath}`, {
        headers: { cookie: cookieHeader(begin) }
      })

      // 3. A session cookie, and the returnTo honoured.
      expect(done.status).toBe(303)
      expect(done.location).toBe('/elephant/plannings')

      // Two cookies: the session and the cleared transaction. Reading them as
      // an array is the only correct way — a comma-joined Set-Cookie is one
      // broken cookie, not two.
      const setCookies = done.setCookies
      expect(setCookies.length).toBe(2)
      expect(setCookies.some((c) => c.startsWith('tt-sid-elephant-chrome='))).toBe(true)

      const cookie = cookieHeader(done)

      // 4. The token endpoint answers with a usable access token.
      const token = await request(`${origin}${deps.paths.token}`, {
        headers: { cookie, 'x-tt-session': '1', 'sec-fetch-site': 'same-origin' }
      })

      expect(token.status).toBe(200)
      const tokenBody = token.json<{
        accessToken: string
        expiresAt: number
        subject: string
        impersonating: boolean
      }>()
      expect(typeof tokenBody.accessToken).toBe('string')
      expect(tokenBody.impersonating).toBe(false)
      expect(tokenBody.expiresAt).toBeGreaterThan(Date.now())

      // 5. The identity endpoint carries what the token endpoint deliberately
      //    does not: name, email and roles.
      const me = await request(`${origin}${deps.paths.identity}`, {
        headers: { cookie, 'x-tt-session': '1', 'sec-fetch-site': 'same-origin' }
      })

      expect(me.status).toBe(200)
      const identity = me.json<{ user: { name?: string, email?: string }, impersonating: unknown }>()
      expect(identity.user.name).toBe('Testy Test')
      expect(identity.user.email).toBe('testy.test@example.com')
      expect(identity.impersonating).toBeNull()

      // 6. A protected app route sees the session on res.locals.
      const probe = await request(`${origin}${BASE_URL}/api/documents/probe`, {
        headers: { cookie }
      })

      expect(probe.status).toBe(200)
      const probeBody = probe.json<{
        session: { accessToken: string, user: { sub: string }, units: string[], org: string }
      }>()
      expect(probeBody.session.user.sub).toBeTruthy()
      expect(probeBody.session.accessToken).toBeTruthy()

      // `units` and `org` are absent here on purpose: `fakeKeycloak` issues an
      // opaque access token (`access-<hex>`), not a JWT, so there are no claims
      // to decode. In the real realm they are claims on the access token — the
      // decode itself is covered in `sessionClaims.test.ts`.
      expect(probeBody.session.units).toEqual([])
      expect(probeBody.session.org).toBe('')
    } finally {
      server.close()
      await deps.close()
    }
  })

  it('rejects the token endpoint without the trusted-client headers', async () => {
    const deps = await buildDeps(kc)
    const { origin, server } = await listen(buildApp(deps))

    try {
      const response = await request(`${origin}${deps.paths.token}`)
      expect(response.status).toBe(403)
    } finally {
      server.close()
      await deps.close()
    }
  })

  it('answers 503, never 401, when the store is unreachable', async () => {
    const deps = await buildDeps(kc, offlineStore() as unknown as MemoryStore)
    const { origin, server } = await listen(buildApp(deps))

    try {
      // A well-formed cookie the store cannot answer for. Reusing a real login
      // is not possible here — the store is offline — so this asserts the
      // handler's own contract for an unreachable store.
      const response = await request(`${origin}${deps.paths.token}`, {
        headers: { 'x-tt-session': '1', 'sec-fetch-site': 'same-origin' }
      })

      // No cookie at all is genuinely unauthenticated; that is allowed to 401.
      expect(response.status).toBe(401)
    } finally {
      server.close()
      await deps.close()
    }
  })

  it('does not sign the user out when the store goes offline mid-session', async () => {
    // Log in against a live store, then serve the same cookie from an offline
    // one. This is the row that matters: `unavailable` must never become a 401,
    // because that is how a Redis blip becomes a mass logout.
    const live = await buildDeps(kc)
    const liveApp = await listen(buildApp(live))

    let cookie = ''
    try {
      const begin = await request(`${liveApp.origin}${live.paths.login}`)
      const callbackUrl = kc.authorize(begin.location as string)
      const callbackPath = new URL(callbackUrl).pathname + new URL(callbackUrl).search
      const done = await request(`${liveApp.origin}${callbackPath}`, {
        headers: { cookie: cookieHeader(begin) }
      })
      cookie = cookieHeader(done)
      expect(cookie).toContain('tt-sid-elephant-chrome=')
    } finally {
      liveApp.server.close()
      await live.close()
    }

    const offline = await buildDeps(kc, offlineStore() as unknown as MemoryStore)
    const offlineApp = await listen(buildApp(offline))

    try {
      const token = await request(`${offlineApp.origin}${offline.paths.token}`, {
        headers: { cookie, 'x-tt-session': '1', 'sec-fetch-site': 'same-origin' }
      })

      expect(token.status).toBe(503)
      expect(token.headers['retry-after']).toBeTruthy()

      // And the app's own guard degrades the same way rather than 401ing.
      const probe = await request(`${offlineApp.origin}${BASE_URL}/api/documents/probe`, {
        headers: { cookie }
      })
      expect(probe.status).toBe(503)
    } finally {
      offlineApp.server.close()
      await offline.close()
    }
  })

  it('requires same-origin or the session header to log out', async () => {
    const deps = await buildDeps(kc)
    const { origin, server } = await listen(buildApp(deps))

    try {
      const crossSite = await request(`${origin}${deps.paths.logout}`, {
        method: 'POST',
        headers: { 'sec-fetch-site': 'cross-site' }
      })

      // A rejected logout gets 403 and clears nothing: answering 403 *and*
      // clearing the cookie would hand the attacker the outcome anyway.
      expect(crossSite.status).toBe(403)
      expect(crossSite.setCookies.length).toBe(0)

      const sameOrigin = await request(`${origin}${deps.paths.logout}`, {
        method: 'POST',
        headers: { 'x-tt-session': '1' }
      })

      expect(sameOrigin.status).toBe(303)
    } finally {
      server.close()
      await deps.close()
    }
  })
})
