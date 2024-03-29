import express from 'express'
import expressWebsockets from 'express-ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectRouteHandlers, mapRoutes } from './routes.js'
import {
  Repository,
  RedisCache,
  CollaborationServer
} from './utils/index.js'
import { createRemoteJWKSet } from 'jose'


/*
 * Read and normalize all environment variables
*/
const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const PROTOCOL = (NODE_ENV === 'production') ? 'https' : process.env.VITE_PROTOCOL || 'https'
const HOST = process.env.HOST || '127.0.0.1'
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5183
const REPOSITORY_URL = process.env.REPOSITORY_URL
const JWKS_URL = process.env.JWKS_URL
const REDIS_URL = process.env.REDIS_URL
const BASE_URL = process.env.BASE_URL || ''

console.info(`Starting API environment "${NODE_ENV}"`)


/**
 * Run the server
 */
async function runServer(): Promise<string> {
  const { apiDir, distDir } = getPaths()
  const { app } = expressWebsockets(express())

  const routes = await mapRoutes(apiDir)

  if (!JWKS_URL) {
    throw new Error('Missing JWKS_URL')
  }

  if (!REPOSITORY_URL) {
    throw new Error('Missing REPOSITORY_URL')
  }

  if (!REDIS_URL) {
    throw new Error('Missing REDIS_URL')
  }

  // Connect to Redis
  const cache = new RedisCache(REDIS_URL)

  if (!await cache.connect()) {
    throw new Error('Failed connecting to Redis')
  }

  // Connect to repository
  const jwks = createRemoteJWKSet(new URL(JWKS_URL))
  try {
    await jwks({ alg: 'ES384', typ: 'JWT' })
  } catch (err: unknown) {
    throw new Error('Failed to fetch JWKS', { cause: err })
  }

  const repository = new Repository(REPOSITORY_URL, jwks)

  app.use(cors({
    credentials: true,
    origin: `${PROTOCOL}://${HOST}:${process.env.DEV_CLIENT_PORT || PORT}`

  }))
  app.use(cookieParser())
  app.use(BASE_URL, express.json())
  app.use(BASE_URL || '', express.static(distDir))


  // Create collaboration and hocuspocus server
  const collaborationServer = new CollaborationServer({
    name: 'Elephant',
    port: PORT,
    redisUrl: REDIS_URL,
    redisCache: cache,
    repository,
    expressServer: app
  })
  await collaborationServer.listen([`${BASE_URL}/:document`])

  connectRouteHandlers(app, routes, {
    repository,
    collaborationServer
  })

  // Catch all other requests and serve bundled app
  app.get('*', (_, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })

  app.listen(PORT)
  return `${PROTOCOL}://${HOST}:${PORT}`
}

(async () => {
  return await runServer()
})().then(url => {
  console.info(`Serving API on ${url}/api`)
}).catch(ex => {
  console.error(ex)
  process.exit(1)
})


function getPaths(): { distDir: string, apiDir: string } {
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
