import { getSession } from '@auth/express'
import { type NextFunction, type Response, type Request } from 'express'
import { authConfig } from './authConfig.js'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.BASE_URL || ''
const projectRoot = process.cwd()

// Exclude paths when serving a unbundled project locally
const localPaths = [
  ...fs.readdirSync(projectRoot).filter((file) => {
    return fs.statSync(path.join(projectRoot, file)).isDirectory()
  }).map((dir) => `${BASE_URL}/${dir}`),

  `${BASE_URL}/@react-refresh`,
  `${BASE_URL}/@vite`
]

export async function assertAuthenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = res.locals.session ?? (await getSession(req, authConfig))

  if (isUnprotectedRoute(req)) {
    next()
    return
  }

  if (!session?.user) {
    res.redirect(`${process.env.BASE_URL}/login`)
  } else {
    next()
  }
}

export function isUnprotectedRoute(req: Request): boolean {
  const unprotectedRoutes = getUnprotectedRoutes()
  return unprotectedRoutes.some((route) => req.path.startsWith(route))
}

function getUnprotectedRoutes(): string[] {
  const unprotectedRoutes = [
    `${BASE_URL}/auth/`,
    `${BASE_URL}/init`,
    `${BASE_URL}/assets`
  ]

  if (process.env.NODE_ENV === 'development') {
    return unprotectedRoutes.concat(localPaths)
  }

  return unprotectedRoutes
}

