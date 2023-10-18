import fs from 'node:fs'
import path from 'node:path'

interface Route {
  path: string
  params: string[]
  handler?: RouteHandler
}

type RouteParameters = Record<string, string>
type RouteHeaders = Record<string, string>
type RouteQuery = Record<string, string>
interface RouteRequest {
  params: RouteParameters
  query: RouteQuery
  headers: RouteHeaders
}

interface RouteHandler {
  GET?: (req: RouteRequest) => Promise<void>
  POST?: (req: RouteRequest) => Promise<void>
  PUT?: (req: RouteRequest) => Promise<void>
  DELETE?: (req: RouteRequest) => Promise<void>
}

type RouteMap = Record<string, Route>

export async function mapRoutes(apiDir): Promise<RouteMap> {
  const routes: RouteMap = {}
  buildRoutes(routes, apiDir)

  for (const route in routes) {
    console.log('Route: ', route)
    await importRouteHandler(routes[route].path)
  }

  return routes
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

async function importRouteHandler(path: string): Promise<RouteHandler> {
  const handlers = await import(path)

  return {
    GET: handlers?.GET instanceof Function ? handlers.GET : undefined,
    POST: handlers?.POST instanceof Function ? handlers.POST : undefined,
    PUT: handlers?.GET instanceof Function ? handlers.PUT : undefined,
    DELETE: handlers?.DELETE instanceof Function ? handlers.DELETE : undefined
  }
}
