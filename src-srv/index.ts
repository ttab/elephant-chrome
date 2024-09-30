import express, { type NextFunction, type Request, type Response } from 'express'
import type { RequestHandler, Express } from 'express-serve-static-core'
import expressWebsockets from 'express-ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectRouteHandlers, mapRoutes } from './routes.js'
import ViteExpress from 'vite-express'
import { Repository } from '@/shared/Repository.js'
import {
  RedisCache,
  CollaborationServer
} from './utils/index.js'

import { ExpressAuth } from '@auth/express'
import { assertAuthenticatedUser } from './utils/assertAuthenticatedUser.js'
import { authConfig } from './utils/authConfig.js'
import logger from './lib/logger.js'
import { pinoHttp } from 'pino-http'
import assertEnvs from './lib/assertEnvs.js'

/*
 * Read and normalize all environment variables
*/
const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const PROTOCOL = process.env.VITE_PROTOCOL || 'https'
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5183
const REPOSITORY_URL = process.env.REPOSITORY_URL || ''
const REDIS_URL = process.env.REDIS_URL || ''
const BASE_URL = process.env.BASE_URL || ''

/**
 * Run the server
 */
export async function runServer(): Promise<string> {
  assertEnvs()

  const { apiDir, distDir } = getPaths()
  const { app } = expressWebsockets(express())


  const routes = await mapRoutes(apiDir)

  // Connect to Redis
  const cache = new RedisCache(REDIS_URL)

  await cache.connect().catch(ex => {
    throw new Error('connect to redis cache', { cause: ex })
  })

  const repository = new Repository(REPOSITORY_URL)

  app.set('trust proxy', true)
  app.use(`${BASE_URL}/api/auth/*`, ExpressAuth(authConfig) as RequestHandler)
  app.use(`${BASE_URL}/api/documents`, assertAuthenticatedUser as RequestHandler)
  app.use(`${BASE_URL}/api/introspection`, assertAuthenticatedUser as RequestHandler)

  app.use(cors({
    credentials: true,
    origin: `${PROTOCOL}://${HOST}:${PORT}`

  }))
  app.use(cookieParser())
  app.use(BASE_URL, express.json())

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
    redisCache: cache,
    repository,
    expressServer: app
  })

  await collaborationServer.listen([`${BASE_URL}/:document`]).catch(ex => {
    throw new Error(`start collaboration server on port ${PORT}`, { cause: ex })
  })

  connectRouteHandlers(app, routes, {
    repository,
    cache,
    collaborationServer
  })


  process.on('unhandledException', (ex) => {
    logger.fatal('Unhandled exception', { cause: ex })

    collaborationServer.close().then(() => {
      process.exit(1)
    }).catch(ex => logger.fatal(ex))

    setTimeout(() => {
      process.abort()
    }, 1000).unref()

    process.exit(1)
  })

  process.on('unhandledRejection', (ex) => {
    logger.fatal('Unhandled rejection', { cause: ex })

    collaborationServer.close().then(() => {
      process.exit(1)
    }).catch(ex => logger.fatal(ex))

    setTimeout(() => {
      process.abort()
    }, 1000).unref()

    process.exit(1)
  })

  const serverUrl = `${PROTOCOL}://${HOST}:${PORT}${BASE_URL || ''}`

  switch (NODE_ENV) {
    case 'development': {
      ViteExpress.listen(app as unknown as Express, PORT, () => {
        logger.info(`Development Server running on ${serverUrl}`)
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
      app.listen(PORT)

      break
    }
  }

  return serverUrl
}

runServer().then(url => {
  logger.info(`Serving API on ${url}/api`)
}).catch(ex => {
  console.error(ex)
  process.exit(1)
})


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
