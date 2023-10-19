import express from 'express'
import expressWebsockets from 'express-ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectRouteHandler, mapRoutes } from './routes.ts'

dotenv.config()

const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const API_PORT = parseInt(process.env.API_PORT) || 5183

console.log(`Starting server environment "${NODE_ENV}"`)

async function runServer(): Promise<string> {
  const { apiDir, distDir } = getPaths()
  const { app } = expressWebsockets(express())
  const routes = await mapRoutes(apiDir)

  app.use(cors())
  app.use(cookieParser())
  app.use(express.json())
  app.use(express.static(distDir))

  for (const route in routes) {
    const routePath = path.join('/api', route)
    const { GET, POST, PUT, DELETE } = routes[route].handlers

    if (GET) {
      connectRouteHandler(app, routePath, GET)
    }
    if (POST) {
      connectRouteHandler(app, routePath, POST)
    }
    if (PUT) {
      connectRouteHandler(app, routePath, PUT)
    }
    if (DELETE) {
      connectRouteHandler(app, routePath, DELETE)
    }
  }

  app.listen(API_PORT)

  return `http://localhost:${API_PORT}`
}

(async () => {
  return await runServer()
})().then(url => {
  console.log(`Serving api on ${url}`)
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
