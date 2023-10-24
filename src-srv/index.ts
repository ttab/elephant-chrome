import express from 'express'
import expressWebsockets from 'express-ws'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { connectRouteHandler, connectWebsocketHandler, mapRoutes } from './routes.ts'

// HocusPocus and friends
import { type Hocuspocus, Server } from '@hocuspocus/server'
import { Logger } from '@hocuspocus/extension-logger'
import { Redis } from '@hocuspocus/extension-redis'
import { Database } from '@hocuspocus/extension-database'
import { createClient } from 'redis'

dotenv.config()

const NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const API_PORT = parseInt(process.env.API_PORT) || 5183
const API_URL = process.env.API_URL || 'https://localhost'

console.info(`Starting API environment "${NODE_ENV}"`)

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

    const { GET, POST, PUT, PATCH, DELETE, WEB_SOCKET } = routes[route].handlers

    if (GET) {
      connectRouteHandler(app, routePath, GET)
    }

    if (POST) {
      connectRouteHandler(app, routePath, POST)
    }

    if (PUT) {
      connectRouteHandler(app, routePath, PUT)
    }

    if (PATCH) {
      connectRouteHandler(app, routePath, PATCH)
    }

    if (DELETE) {
      connectRouteHandler(app, routePath, DELETE)
    }

    if (WEB_SOCKET) {
      connectWebsocketHandler(app, routePath, WEB_SOCKET)
    }
  }

  const server = await createServer()
  app.ws('/:document', (websocket, request) => {
    server.handleConnection(websocket, request)
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


async function createServer(): Promise<Hocuspocus> {
  const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
  })
  await redisClient.connect()

  const server = Server.configure({
    port: parseInt(process.env.API_PORT),
    extensions: [
      new Logger(),
      new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
      }),
      new Database({
        fetch: async (data) => {
          console.log(data.socketId, data.documentName)
          const docId = '7de322ac-a9b2-45d9-8a0f-f1ac27f9cbfe' // data.documentName
          const cachedDoc = await redisClient.get(docId)
          console.log('<--CACHED DOCUMENT-->')
          console.log(cachedDoc)

          if (cachedDoc) {
            return new Uint8Array(
              Buffer.from(cachedDoc, 'binary')
            )
          }

          const [newDocStr/* , newDocId */] = await exampleYJSDocument()
          return new Uint8Array(
            Buffer.from(newDocStr, 'binary')
          )
        },
        store: async ({ documentName, state }) => {
          console.log('<--STORING DOCUMENT-->')
          console.log(Buffer.from(state).toString('binary'))

          redisClient.set(
            documentName,
            Buffer.from(state).toString('binary')
          ).catch(ex => {
            console.log(ex)
          })
        }
      })
    ],
    onAuthenticate: async (data) => {
      return {}
    }
  })

  return server
}

async function exampleYJSDocument(): Promise<[string, string]> {
  const docStr = JSON.stringify([
    {
      type: 'core/text',
      id: '538345e5-bacc-48f9-8ef1-a219891b60eb',
      class: 'text',
      properties: {
        type: 'h1'
      },
      children: [
        { text: 'Better music?' }
      ]
    },
    {
      type: 'core/text',
      id: '538345e5-bacc-48f9-9ed2-b219892b51dc',
      class: 'text',
      properties: {
        type: 'preamble'
      },
      children: [
        { text: 'It is one of those days when better music makes all the difference in the world. At least to me, my inner and imaginary friend.' }
      ]
    }
  ])

  const docId = '538345e5-bacc-48f9-8ef1-a219891b61ea'

  return await Promise.resolve([docStr, docId])
}
