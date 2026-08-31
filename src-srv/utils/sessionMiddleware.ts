import { type NextFunction, type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { jwtVerify, type JWTVerifyGetKey } from 'jose'
import { createSessionReader, readSessionSid, type SessionOutcome } from '@ttab/tt-session'
import { claimsFromAccessToken } from '@/shared/sessionClaims.js'
import logger from '../lib/logger.js'
import type { SessionDeps } from './sessionDeps.js'

/**
 * The session as the rest of the server consumes it.
 *
 * Flattened out of `SessionRecord` deliberately: route handlers and
 * `getContextFromValidSession()` want an access token, a user and the TT
 * claims, not the store's persisted shape.
 */
export interface ServerSession {
  accessToken: string
  user: {
    sub: string
    name: string
    email: string
    image: string
    id: string
  }
  units: string[]
  org: string
  roles: string[]
  isAdmin: boolean
  scope: string
}

declare module 'express-serve-static-core' {
  interface Request {
    /** The raw library outcome. `undefined` on unprotected routes. */
    ttSession?: SessionOutcome
  }
}

function toServerSession(outcome: SessionOutcome): ServerSession | null {
  if (outcome.status !== 'valid' && outcome.status !== 'degraded') {
    return null
  }

  if (!outcome.tokens) {
    return null
  }

  const { principal } = outcome.record
  const { units, org } = claimsFromAccessToken(outcome.tokens.accessToken)

  return {
    accessToken: outcome.tokens.accessToken,
    user: {
      sub: principal.sub,
      name: principal.name ?? '',
      email: principal.email ?? '',
      image: '',
      id: principal.sub
    },
    units,
    org,
    roles: principal.roles,
    isAdmin: principal.isAdmin,
    scope: principal.scope
  }
}

/**
 * Reads the session onto every request that is not explicitly unprotected.
 *
 * `createSessionReader` is the Express counterpart to `React.cache()`:
 * concurrent calls for the same sid share one store round trip, with no
 * staleness window.
 */
export function sessionMiddleware(baseUrl: string, deps: SessionDeps) {
  const readSid = createSessionReader({
    store: deps.store,
    refresher: deps.refresher,
    ttlSeconds: deps.ttlSeconds
  })

  return (req: Request, res: Response, next: NextFunction): void => {
    if (isUnprotectedRoute(baseUrl, req)) {
      next()
      return
    }

    const sid = readSessionSid(req.headers.cookie, {
      secrets: deps.secrets,
      namespace: deps.namespace,
      secure: deps.secure
    })

    if (sid === null) {
      req.ttSession = { status: 'missing' }
      next()
      return
    }

    readSid(sid)
      .then((outcome) => {
        req.ttSession = outcome

        const session = toServerSession(outcome)
        if (session) {
          res.locals.session = session
        }

        next()
      })
      .catch((error) => {
        next(error)
      })
  }
}

/**
 * Guards a protected route.
 *
 * The status mapping is the whole contract, and the dangerous row is the middle
 * one: `unavailable` means "we do not know", not "not signed in". Answering 401
 * there is how a Redis blip becomes a mass logout.
 */
export function assertAuthenticatedUser(baseUrl: string, JWKS: JWTVerifyGetKey) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isUnprotectedRoute(baseUrl, req)) {
        next()
        return
      }

      const outcome = req.ttSession ?? { status: 'missing' as const }

      if (outcome.status === 'valid' || (outcome.status === 'degraded' && outcome.tokens)) {
        next()
        return
      }

      if (outcome.status === 'unavailable' || outcome.status === 'degraded') {
        // Never 401. The store is unreachable or slow; the cookie is untouched
        // and the client is expected to keep its token and retry.
        logger.warn({ reason: outcome.reason }, 'session store degraded')
        res.setHeader('Retry-After', '5')
        res.status(503).send('Service Unavailable')
        return
      }

      // Genuinely no session. A machine client may still present a bearer token.
      const bearerToken = req.headers['authorization']?.toString().replace(/^Bearer\s+/i, '')

      if (bearerToken) {
        try {
          await jwtVerify(bearerToken, JWKS)
          next()
          return
        } catch (ex) {
          logger.info(ex, 'Authentication failed:')
          res.status(401).send('Unauthorized')
          return
        }
      }

      res.redirect(`${baseUrl}/login`)
    } catch (err) {
      next(err)
    }
  }
}

export function isUnprotectedRoute(baseUrl: string, req: Request): boolean {
  const unprotectedRoutes = getUnprotectedRoutes(baseUrl)
  return unprotectedRoutes.some((route) => req.path.startsWith(route))
}

function getUnprotectedRoutes(baseUrl: string): string[] {
  const unprotectedRoutes = [
    `${baseUrl}/auth/`,
    `${baseUrl}/api/auth/`,
    `${baseUrl}/api/session/`,
    `${baseUrl}/init`,
    `${baseUrl}/assets`
  ]

  if (process.env.NODE_ENV === 'development') {
    const projectRoot = process.cwd()

    // Exclude paths when serving a unbundled project locally
    const localPaths = [
      ...fs.readdirSync(projectRoot).filter((file) => {
        return fs.statSync(path.join(projectRoot, file)).isDirectory()
      }).map((dir) => `${baseUrl}/${dir}`),

      `${baseUrl}/@react-refresh`,
      `${baseUrl}/@vite`
    ]

    return unprotectedRoutes.concat(localPaths)
  }

  return unprotectedRoutes
}
