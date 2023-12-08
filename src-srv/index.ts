import express from 'express'
import expressWebsockets from 'express-ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectRouteHandlers, mapRoutes } from './routes.js'
import { createServer as createHocuspocusServer } from './utils/hocuspocus.js'
import { RedisCache } from './utils/RedisCache.js'
import { Repository } from './utils/Repository.js'
import { createRemoteJWKSet } from 'jose'

const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const PROTOCOL = (NODE_ENV === 'production') ? 'https' : process.env.VITE_PROTOCOL || 'https'

const CLIENT_HOST = process.env.VITE_CLIENT_HOST || '127.0.0.1'
const CLIENT_PORT = process.env.VITE_CLIENT_PORT ? parseInt(process.env.VITE_CLIENT_PORT) : 5173

const API_HOST = process.env.VITE_API_HOST || '127.0.0.1'
const API_PORT = process.env.VITE_API_PORT ? parseInt(process.env.VITE_API_PORT) : 5183
const API_URL = `${PROTOCOL}://${API_HOST}:${API_PORT}`

const REPOSITORY_URL = process.env.REPOSITORY_URL
const JWKS_URL = process.env.JWKS_URL

console.info(`Starting API environment "${NODE_ENV}"`)

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

  // Connect to Redis
  const cache = new RedisCache(process.env.REDIS_HOST || 'localhost', process.env.REDIS_PORT || 6379)
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


  // Create hocuspocus server
  const hpServer = await createHocuspocusServer({
    repository,
    cache
  })

  app.use(cors({
    credentials: true,
    origin: `${PROTOCOL}://${CLIENT_HOST}:${CLIENT_PORT}`
  }))
  app.use(cookieParser())
  app.use(express.json())
  app.use(express.static(distDir))

  connectRouteHandlers(app, routes, {
    repository
  })

  app.ws('/:document', (websocket, request) => {
    hpServer.handleConnection(websocket, request)
  })

  app.listen(API_PORT)

  return API_URL
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
