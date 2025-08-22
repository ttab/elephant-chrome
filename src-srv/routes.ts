import fs from 'node:fs'
import path from 'node:path'
import type { Request, Response } from 'express'
import type { Application, WebsocketRequestHandler } from 'express-ws'
import type { Repository } from '@/shared/Repository.js'
import type { CollaborationServer } from './collaboration/CollaborationServer.js'
import type { RedisCache } from './utils/RedisCache.js'
import logger from './lib/logger.js'

import { raw as expressRaw } from 'express'

/* Route types */
interface Route {
  path: string
  params: string[]
  handlers?: RouteHandlers
}

interface RouteInitContext {
  repository: Repository
  cache: RedisCache
  collaborationServer: CollaborationServer
  [key: string]: unknown
}

interface RouteContext extends RouteInitContext {
  res: Response
}

export interface RouteContentResponse {
  payload: unknown
  statusCode?: number
}

export interface RouteStatusResponse {
  statusCode: number
  statusMessage: string
}

export type RouteHandler = (req: Request, context: RouteContext) => Promise<RouteContentResponse | RouteStatusResponse>

interface ApiResponseInterface {
  isStatus: (value: unknown) => value is RouteStatusResponse
  isContent: (value: unknown) => value is RouteContentResponse
}

interface RouteHandlers {
  GET?: RouteHandler
  POST?: RouteHandler
  PUT?: RouteHandler
  PATCH?: RouteHandler
  DELETE?: RouteHandler
  WEB_SOCKET?: WebsocketRequestHandler
}

type RouteMap = Record<string, Route>

const ApiResponse: ApiResponseInterface = {
  isStatus: (value): value is RouteStatusResponse => {
    return value !== null && typeof value === 'object' && ('statusCode' in value && 'statusMessage' in value)
  },
  isContent: (value): value is RouteContentResponse => {
    return value !== null && typeof value === 'object' && 'payload' in value
  }
}

/*
 * Map directory structure under api/ to express route paths.
 * Directory or file names enclosed in brackets, i.e api/planning[id]/[action].ts
 * would become "api/planning/:id/:action".
 */
export async function mapRoutes(apiDir: string): Promise<RouteMap> {
  const routes: RouteMap = {}

  buildRoutes(routes, apiDir)

  for (const route in routes) {
    routes[route].handlers = await importRouteHandler(routes[route].path)
  }

  return routes
}

/**
 * Connect all route handlers found to their respective routes. Order
 * the route by specificity so that /documents:/id comes after /documents/:id/restore
 * so that less specific does not catch all.
 */
export function connectRouteHandlers(app: Application, routes: RouteMap, context: RouteInitContext): Application {
  const BASE_URL = process.env.BASE_URL || ''
  const sortedRoutes = Object.entries(routes).sort().reverse()

  sortedRoutes.forEach(([basePath, route]) => {
    const routePath = path.join(BASE_URL, '/api', basePath)
    const { GET, POST, PUT, PATCH, DELETE, WEB_SOCKET } = route.handlers || {}

    if (GET) {
      connectRouteHandler(app, routePath, GET, context)
    }

    if (POST) {
      connectRouteHandler(app, routePath, POST, context)
    }

    if (PUT) {
      connectRouteHandler(app, routePath, PUT, context)
    }

    if (PATCH) {
      connectRouteHandler(app, routePath, PATCH, context)
    }

    if (DELETE) {
      connectRouteHandler(app, routePath, DELETE, context)
    }

    if (WEB_SOCKET) {
      connectWebsocketHandler(app, routePath, WEB_SOCKET, context)
    }
  })

  return app
}

/*
 * Connect an exported route handler like GET, POST, etc to a specific express path.
 */
function connectRouteHandler(app: Application, routePath: string, func: RouteHandler, initContext: RouteInitContext): Application {
  const handlerFunc = (req: Request, res: Response): void => {
    const context: RouteContext = {
      ...initContext,
      res
    }

    func(req, context).then((response) => {
      if (ApiResponse.isContent(response)) {
        const { statusCode = 200, payload = '' } = response

        res.status(statusCode).json(payload)
      } else if (ApiResponse.isStatus(response)) {
        const { statusCode, statusMessage } = response

        // Accepted - used with proxy streaming
        if (statusCode === 202) {
          return
        }

        if (statusCode === 302) {
          res.redirect(statusMessage)
          return
        }

        res.status(statusCode).json({
          statusCode,
          statusMessage
        })
      } else {
        res.status(500).json({
          statusCode: 500,
          statusMessage: 'Incorrect response from route handler. Expected payload or statusCode plus statusMessage.'
        })
      }
    }).catch((ex: Error) => {
      logger.error(ex, 'RouteHandler error')
      res.statusCode = 500
      res.statusMessage = ex?.message || 'Unknown error'
      res.send('')
    })
  }

  switch (func.name) {
    case 'GET':
      return app.get(routePath, handlerFunc)

    case 'POST':
      if (func.length > 0) {
        return app.post(
          routePath,
          (req, res, next) => {
            if (req.is('application/octet-stream')) {
              return expressRaw({ type: 'application/octet-stream' })(req, res, next)
            }
            next()
          },
          handlerFunc
        )
      }
      return app.post(routePath, handlerFunc)

    case 'PUT':
      return app.put(routePath, handlerFunc)

    case 'PATCH':
      return app.patch(routePath, handlerFunc)

    case 'DELETE':
      return app.delete(routePath, handlerFunc)
  }

  return app
}

// FIXME: WebSocket handlers need some more thought
function connectWebsocketHandler(app: Application, routePath: string, func: WebsocketRequestHandler, _: RouteInitContext): Application {
  // FIXME: Implement support for context sharing with websocket handlers, context is ignored for now
  logger.warn('Websocket route handlers don\'t have access to context')

  app.ws(routePath, func)
  return app
}

function buildRoutes(routes: RouteMap, directory: string, baseRoute: string = ''): void {
  const items = fs.readdirSync(directory)

  for (const item of items) {
    if (item.endsWith('.js.map')) {
      continue
    }

    const itemPath = path.join(directory, item)
    const route = path.join(baseRoute, item)

    if (fs.statSync(itemPath).isDirectory()) {
      buildRoutes(routes, itemPath, route)
    } else {
      const [expressRoute, obj] = buildRoute(route, itemPath)
      routes[expressRoute] = obj
    }
  }
}


function buildRoute(route: string, path: string): [string, Route] {
  const paramsRegex = /\[([^[\]]+)]/g
  const params = []
  let match: RegExpExecArray | null

  while ((match = paramsRegex.exec(route)) !== null) {
    const paramName = match[1]
    params.push(paramName)
  }

  const expressPath = route
    .replace(/\[([^/]+)]/g, ':$1')
    .replace(/index\.(t|j)s$/, '')
    .replace(/\.(t|j)s$/, '')

  return [expressPath, { path, params }]
}

async function importRouteHandler(path: string): Promise<RouteHandlers> {
  const handlers: {
    [key: string]: RouteHandlers | undefined
  } = await import(path) as {
    [key: string]: RouteHandlers | undefined
  }

  return {
    GET: typeof handlers.GET === 'function' ? handlers.GET : undefined,
    POST: typeof handlers.POST === 'function' ? handlers.POST : undefined,
    PUT: typeof handlers.PUT === 'function' ? handlers.PUT : undefined,
    PATCH: typeof handlers.PATCH === 'function' ? handlers.PATCH : undefined,
    DELETE: typeof handlers.DELETE === 'function' ? handlers.DELETE : undefined,
    WEB_SOCKET: typeof handlers.WEB_SOCKET === 'function' ? handlers.WEB_SOCKET : undefined
  }
}
