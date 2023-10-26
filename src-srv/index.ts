import express from 'express'
import expressWebsockets from 'express-ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectRouteHandlers, mapRoutes } from './routes.ts'
import { createServer as createHocuspocusServer } from './utils/hocuspocus.ts'
import { RedisCache } from './utils/RedisCache.ts'

dotenv.config()

const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const API_PORT = parseInt(process.env.API_PORT) || 5183
const API_URL = process.env.API_URL || 'https://localhost'

console.info(`Starting API environment "${NODE_ENV}"`)

async function runServer(): Promise<string> {
  const { apiDir, distDir } = getPaths()
  const { app } = expressWebsockets(express())

  const routes = await mapRoutes(apiDir)

  const cache = new RedisCache(process.env.REDIS_HOST, process.env.REDIS_PORT)
  if (!await cache.connect()) {
    console.error('Failed connecting to Redis')
  }
  const hpServer = await createHocuspocusServer({
    cache
  })

  app.use(cors())
  app.use(cookieParser())
  app.use(express.json())
  app.use(express.static(distDir))

  connectRouteHandlers(app, routes)

  app.ws('/:document', (websocket, request) => {
    hpServer.handleConnection(websocket, request)
  })

  app.listen(API_PORT)

  return `${API_URL}:${API_PORT}`
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
