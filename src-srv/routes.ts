import fs from 'node:fs'
import path from 'node:path'
import type { Request, Response } from 'express'
import type { Application, WebsocketRequestHandler } from 'express-ws'
import type { Repository } from './utils/Repository.js'
import type { CollaborationServer } from './utils/CollaborationServer.js'

/* Route types */
interface Route {
  path: string
  params: string[]
  handlers?: RouteHandlers
}

interface RouteInitContext {
  repository: Repository
  collaborationServer: CollaborationServer
  [key: string]: unknown
}

interface RouteContext extends RouteInitContext {
  res: Response
}

interface RouteContentResponse {
  payload: unknown
  statusCode?: number
}

interface RouteStatusResponse {
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

export const ApiResponse: ApiResponseInterface = {
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
 * Connect all route handlers found to their respective routes
 */
export function connectRouteHandlers(app: Application, routes: RouteMap, context: RouteInitContext): Application {
  const BASE_URL = process.env.BASE_URL || ''
  for (const route in routes) {
    const routePath = path.join(BASE_URL, '/api', route)

    const { GET, POST, PUT, PATCH, DELETE, WEB_SOCKET } = routes[route].handlers || {}

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
  }

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
    }).catch(ex => {
      console.error(ex)
      res.statusCode = 500
      res.statusMessage = ex?.message || 'Unknown error'
      res.send('')
    })
  }

  switch (func.name) {
    case 'GET':
      return app.get(routePath, handlerFunc)

    case 'POST':
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
  console.warn('Websocket route handlers don\'t have access to context')

  app.ws(routePath, func)
  return app
}

function buildRoutes(routes: RouteMap, directory: string, baseRoute: string = ''): void {
  const items = fs.readdirSync(directory)

  items.forEach(item => {
    const itemPath = path.join(directory, item)
    const route = path.join(baseRoute, item)

    if (fs.statSync(itemPath).isDirectory()) {
      buildRoutes(routes, itemPath, route)
    } else {
      const [expressRoute, obj] = buildRoute(route, itemPath)
      routes[expressRoute] = obj
    }
  })
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
  const handlers = await import(path)

  return {
    GET: handlers?.GET instanceof Function ? handlers.GET : undefined,
    POST: handlers?.POST instanceof Function ? handlers.POST : undefined,
    PUT: handlers?.GET instanceof Function ? handlers.PUT : undefined,
    PATCH: handlers?.GET instanceof Function ? handlers.PATCH : undefined,
    DELETE: handlers?.DELETE instanceof Function ? handlers.DELETE : undefined,
    WEB_SOCKET: handlers?.WEB_SOCKET instanceof Function ? handlers.WEB_SOCKET : undefined
  }
}
