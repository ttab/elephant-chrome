import fs from 'node:fs'
import path from 'node:path'
import type { Request, Application } from 'express'

/* Route types */
interface Route {
  path: string
  params: string[]
  handlers?: RouteHandlers
}

interface RouteContentResponse {
  payload: unknown
  statusCode?: number
}

interface RouteStatusResponse {
  statusCode: number
  statusMessage: string
}

type RouteHandler = (req: Request) => Promise<RouteContentResponse | RouteStatusResponse>

export interface ApiResponseInterface {
  isStatus: (value: unknown) => value is RouteStatusResponse
  isContent: (value: unknown) => value is RouteContentResponse
}

interface RouteHandlers {
  GET?: RouteHandler
  POST?: RouteHandler
  PUT?: RouteHandler
  DELETE?: RouteHandler
}

type RouteMap = Record<string, Route>

export const ApiResponse: ApiResponseInterface = {
  isStatus: (value): value is RouteStatusResponse => {
    return typeof value === 'object' && ('statusCode' in value && 'statusMessage' in value)
  },
  isContent: (value): value is RouteContentResponse => {
    return typeof value === 'object' && 'payload' in value
  }
}

/*
 * Map directory structure under api/ to express route paths.
 * Direcory or file names enclosed in brackets, i.e api/planning[id]/[action].ts
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

/*
 * Connect an exported route handler like GET, POST, etc to a specific express path.
 */
export function connectRouteHandler(app: Application, routePath: string, func: RouteHandler): void {
  app.get(routePath, (req, res) => {
    func(req).then((response) => {
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
      res.statusMessage = ex?.message || 'Uknown error'
      res.send('')
    })
  })
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
  let match: RegExpExecArray

  while ((match = paramsRegex.exec(route)) !== null) {
    const paramName = match[1]
    params.push(paramName)
  }

  const expressPath = route
    .replace(/\[([^/]+)]/g, ':$1')
    .replace(/index\.ts$/, '')
    .replace(/\.ts$/, '')

  return [expressPath, { path, params }]
}

async function importRouteHandler(path: string): Promise<RouteHandlers> {
  const handlers = await import(path)

  return {
    GET: handlers?.GET instanceof Function ? handlers.GET : undefined,
    POST: handlers?.POST instanceof Function ? handlers.POST : undefined,
    PUT: handlers?.GET instanceof Function ? handlers.PUT : undefined,
    DELETE: handlers?.DELETE instanceof Function ? handlers.DELETE : undefined
  }
}
