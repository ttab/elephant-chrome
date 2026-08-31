import express, { type NextFunction, type Request, type Response } from 'express'
import type { Express } from 'express-serve-static-core'
import expressWebsockets from 'express-ws'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'

import { connectRouteHandlers, mapRoutes } from './routes.js'
import ViteExpress from 'vite-express'
import { Repository } from '@/shared/Repository.js'
import { User } from '@/shared/User.js'
import { TokenService } from '@/shared/TokenService.js'
import {
  RedisCache,
  CollaborationServer
} from './utils/index.js'

import { expressHandler } from '@ttab/tt-session/express'
import { createSessionDeps, loginAuthorizationParams } from './utils/sessionDeps.js'
import { assertAuthenticatedUser, sessionMiddleware } from './utils/sessionMiddleware.js'
import logger from './lib/logger.js'
import { pinoHttp } from 'pino-http'
import assertEnvs from './lib/assertEnvs.js'
import { setSystemLanguage } from '@/shared/getSystemLanguage.js'

import Pyroscope from '@pyroscope/nodejs'
import { createRemoteJWKSet } from 'jose'

/*
 * Read and normalize all environment variables
*/
const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const PROTOCOL = process.env.VITE_PROTOCOL || 'https'
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5183
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || ''
const TLS_KEY_PATH = process.env.TLS_KEY_PATH || ''
const TLS_PORT = process.env.TLS_PORT ? parseInt(process.env.TLS_PORT) : 1443
const REPOSITORY_URL = process.env.REPOSITORY_URL || ''
const REDIS_URL = process.env.REDIS_URL || ''
const BASE_URL = process.env.BASE_URL || ''
const USER_URL = process.env.USER_URL || ''
const AUTH_KEYCLOAK_ISSUER = process.env.AUTH_KEYCLOAK_ISSUER
const AUTH_KEYCLOAK_PROVIDER = process.env.AUTH_KEYCLOAK_PROVIDER ?? process.env.AUTH_KEYCLOAK_ISSUER ?? ''
const AUTH_KEYCLOAK_ID = process.env.AUTH_KEYCLOAK_ID || ''
const AUTH_KEYCLOAK_SECRET = process.env.AUTH_KEYCLOAK_SECRET || ''
const AUTH_KEYCLOAK_IDP_HINT = process.env.AUTH_KEYCLOAK_IDP_HINT
const ELEPHANT_CHROME_CLIENT_ID = process.env.ELEPHANT_CHROME_CLIENT_ID || ''
const ELEPHANT_CHROME_CLIENT_SECRET = process.env.ELEPHANT_CHROME_CLIENT_SECRET || ''
const PYROSCOPE_URL = process.env.PYROSCOPE_URL || ''
const AUTH_POST_LOGOUT_URI = process.env.AUTH_POST_LOGOUT_URI || ''

/*
 * Session (@ttab/tt-session)
 *
 * The sid secret must be byte-identical on every replica: if replicas disagree
 * each rejects the others' cookies, which surfaces as a random mass logout.
 * Both values are read so a rotation can overlap — the first signs, all verify.
*/
const TT_SESSION_SID_SECRET = process.env.TT_SESSION_SID_SECRET || ''
const TT_SESSION_SID_SECRET_OLD = process.env.TT_SESSION_SID_SECRET_OLD || ''
const TT_SESSION_REDIS_URL = process.env.TT_SESSION_REDIS_URL || ''
const TT_SESSION_TTL_SECONDS = process.env.TT_SESSION_TTL_SECONDS
  ? parseInt(process.env.TT_SESSION_TTL_SECONDS)
  : 86400
// One host means one cookie, so namespace it or another TT app on the same host
// silently takes the session over with its own client grants.
const TT_SESSION_NAMESPACE = process.env.TT_SESSION_NAMESPACE || 'elephant-chrome'
const APP_ORIGIN = process.env.APP_ORIGIN || ''

/**
 * Run the server
 */
export async function runServer(): Promise<string> {
  assertEnvs()
  setSystemLanguage(process.env.SYSTEM_LANGUAGE ?? '')

  if (TLS_CERT_PATH && !TLS_KEY_PATH) {
    throw new Error('TLS_CERT_PATH is set but TLS_KEY_PATH is empty')
  }

  const { apiDir, distDir } = getPaths()
  const wsInstance = expressWebsockets(express())
  const { app } = wsInstance


  const routes = await mapRoutes(apiDir)

  // Exit on cache reconnect exhaustion so Kubernetes restarts the pod. The
  // cache is the durable backstop for the 15-120s repo debounce window;
  // continuing to serve with a dead cache silently no-ops new writes.
  const redis = new RedisCache(REDIS_URL, () => {
    logger.fatal('redis cache reconnect attempts exhausted, exiting')
    process.exit(1)
  })

  await redis.connect().catch((ex) => {
    throw new Error('connect to redis cache', { cause: ex })
  })

  const appOrigin = APP_ORIGIN || `${PROTOCOL}://${HOST}:${PORT}`
  const secrets = [TT_SESSION_SID_SECRET, TT_SESSION_SID_SECRET_OLD].filter(Boolean)

  if (!TT_SESSION_REDIS_URL) {
    // A shared cache is workable for local development but wrong in production:
    // the collaboration cache may run `maxmemory-policy allkeys-lru`, which
    // would evict live sessions.
    logger.warn('TT_SESSION_REDIS_URL is unset, falling back to REDIS_URL — use a dedicated instance in production')
  }

  const sessionDeps = await createSessionDeps({
    logger,
    issuer: AUTH_KEYCLOAK_PROVIDER,
    clientId: AUTH_KEYCLOAK_ID,
    clientSecret: AUTH_KEYCLOAK_SECRET,
    appOrigin,
    basePath: `${BASE_URL}/api`,
    redisUrl: TT_SESSION_REDIS_URL || REDIS_URL,
    secrets,
    ttlSeconds: TT_SESSION_TTL_SECONDS,
    secure: appOrigin.startsWith('https://'),
    namespace: TT_SESSION_NAMESPACE,
    idpHint: AUTH_KEYCLOAK_IDP_HINT
  }).catch((e) => {
    throw new Error('configure authentication', { cause: e })
  })

  const { session, paths, provider } = sessionDeps
  const oidcMetadata = provider.configuration.serverMetadata()

  if (!oidcMetadata.jwks_uri) {
    throw new Error('issuer discovery document has no jwks_uri')
  }

  if (!oidcMetadata.token_endpoint) {
    throw new Error('issuer discovery document has no token_endpoint')
  }

  const repository = new Repository(REPOSITORY_URL)

  const JWKS = createRemoteJWKSet(new URL(oidcMetadata.jwks_uri))

  const userTokenService = new TokenService(
    oidcMetadata.token_endpoint,
    ELEPHANT_CHROME_CLIENT_ID,
    ELEPHANT_CHROME_CLIENT_SECRET,
    'user'
  )
  const user = new User(USER_URL, userTokenService)

  app.set('trust proxy', true)

  // The session routes come before the body parser and the session middleware:
  // they authenticate themselves, and each answers a contracted status on every
  // path it owns — an unreachable store included — so none of them needs a
  // try/catch or a guard in front of it.
  app.get(paths.login, expressHandler(
    session.login({ authorizationParams: loginAuthorizationParams(AUTH_KEYCLOAK_IDP_HINT) }),
    { origin: appOrigin }
  ))
  app.get(paths.callback, expressHandler(session.callback(), { origin: appOrigin }))
  app.get(paths.token, expressHandler(session.token(), { origin: appOrigin }))
  app.get(paths.identity, expressHandler(session.session(), { origin: appOrigin }))

  // Federated, preserving what the old `/api/signout` route did: it ended the
  // Keycloak SSO session and landed on AUTH_POST_LOGOUT_URI. Note this signs the
  // user out of *every* TT app, not just this one.
  app.post(paths.logout, expressHandler(
    session.logout({
      federated: true,
      ...(AUTH_POST_LOGOUT_URI ? { postLogoutRedirectUri: AUTH_POST_LOGOUT_URI } : {})
    }),
    { origin: appOrigin }
  ))

  app.use(cors({
    credentials: true,
    origin: `${PROTOCOL}://${HOST}:${PORT}`

  }))
  app.use(BASE_URL, express.json({ limit: '1mb' }))
  app.use(sessionMiddleware(BASE_URL, sessionDeps))

  app.use(`${BASE_URL}/api/documents`, (req, res, next) => {
    assertAuthenticatedUser(BASE_URL, JWKS)(req, res, next).catch(next)
  })
  app.use(`${BASE_URL}/api/introspection`, (req, res, next) => {
    assertAuthenticatedUser(BASE_URL, JWKS)(req, res, next).catch(next)
  })

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      req.log.error({ err }, 'Error occurred')
      res.status(500).send('Internal Server Error')
    } else {
      next()
    }
  })

  // Create collaboration and hocuspocus server
  const collaborationServer = new CollaborationServer({
    name: 'Elephant',
    port: PORT,
    redisUrl: REDIS_URL,
    redis: redis,
    repository,
    expressServer: app,
    user,
    auth: {
      jwks: JWKS,
      verifyOptions: {
        issuer: AUTH_KEYCLOAK_ISSUER
      }
    },
    quiet: process.env.LOG_LEVEL !== 'info' && process.env.LOG_LEVEL !== 'debug'
  })

  await collaborationServer.listen([`${BASE_URL}/:document`]).catch((ex) => {
    throw new Error(`start collaboration server on port ${PORT}`, { cause: ex })
  })

  connectRouteHandlers(app, routes, {
    repository,
    cache: redis,
    collaborationServer
  })


  process.on('uncaughtException', (ex: Error) => {
    logger.fatal({ err: ex }, 'Unhandled exception')

    collaborationServer.close().then(() => {
      process.exit(1)
    }).catch((ex) => logger.fatal(ex))

    setTimeout(() => {
      process.abort()
    }, 1000).unref()

    process.exit(1)
  })

  process.on('unhandledRejection', (ex: Error) => {
    logger.fatal({ err: ex }, 'Unhandled rejection')

    collaborationServer.close().then(() => {
      process.exit(1)
    }).catch((ex) => logger.fatal(ex))

    setTimeout(() => {
      process.abort()
    }, 1000).unref()

    process.exit(1)
  })

  // Run the Pyroscope profiler in push mode
  Pyroscope.SourceMapper.create(['.'])
    .then((sourceMapper) => {
      Pyroscope.init({
        appName: 'elephant-chrome',
        serverAddress: PYROSCOPE_URL,
        sourceMapper: sourceMapper
      })
      Pyroscope.start()
      logger.info(`Started Pyroscope profiler in push mode`)
    })
    .catch((ex) => {
      logger.error(ex, 'Pyroscope profiler failed')
    })

  const serverUrl = `${PROTOCOL}://${HOST}:${PORT}${BASE_URL || ''}`

  const startHttpsServer = (): void => {
    if (!TLS_CERT_PATH) {
      return
    }

    const httpsServer = https.createServer({
      cert: fs.readFileSync(TLS_CERT_PATH),
      key: fs.readFileSync(TLS_KEY_PATH)
    }, app as unknown as http.RequestListener)

    const wss = wsInstance.getWss()
    httpsServer.on('upgrade', (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    })

    httpsServer.listen(TLS_PORT, () => {
      logger.info(`HTTPS server listening on port ${TLS_PORT}`)
    })

    watchTlsFiles(TLS_CERT_PATH, TLS_KEY_PATH, () => {
      try {
        httpsServer.setSecureContext({
          cert: fs.readFileSync(TLS_CERT_PATH),
          key: fs.readFileSync(TLS_KEY_PATH)
        })
        logger.info('TLS certificate reloaded')
      } catch (ex) {
        logger.error({ err: ex }, 'Failed to reload TLS certificate')
      }
    })
  }

  switch (NODE_ENV) {
    case 'development': {
      ViteExpress.listen(app as unknown as Express, PORT, () => {
        logger.info(`Development Server running on ${serverUrl}`)
        // Start HTTPS only after Vite middleware is injected, otherwise
        // requests for /src/* would fall through to the catch-all.
        startHttpsServer()
      })

      break
    }
    case 'production': {
      // Catch all other requests and serve bundled app
      app.use(pinoHttp({ logger }))
      app.use(BASE_URL || '', express.static(distDir))
      app.get('*', (_, res) => {
        res.sendFile(path.join(distDir, 'index.html'))
      })
      app.listen(PORT, () => {
        logger.info(`HTTP server listening on port ${PORT}`)
      })

      startHttpsServer()

      break
    }
  }

  return serverUrl
}

runServer().then((url) => {
  logger.info(`Serving API on ${url}/api`)
}).catch((ex) => {
  logger.error(ex)
  process.exit(1)
})

function watchTlsFiles(certPath: string, keyPath: string, onChange: () => void): void {
  // Kubernetes secret mounts atomically swap the entire directory via a
  // symlink rename, so watch the parent directories rather than the files.
  const dirs = new Set([path.dirname(certPath), path.dirname(keyPath)])
  let timeout: NodeJS.Timeout | null = null

  for (const dir of dirs) {
    fs.watch(dir, () => {
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(onChange, 500)
    })
  }
}

function getPaths(): {
  distDir: string
  apiDir: string
} {
  const distDir = path.join(
    path.resolve(
      path.dirname(
        fileURLToPath(import.meta.url)
      ),
      '..'
    ),
    '/'
  )
  const apiDir = path.join(distDir, 'src-srv/api/')

  return {
    distDir,
    apiDir
  }
}
