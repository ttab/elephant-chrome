import { type NextFunction, type Response, type Request } from 'express'
import fs from 'fs'
import path from 'path'
import { jwtVerify, type JWTVerifyGetKey } from 'jose'
import { getSession } from '@auth/express'
import { authConfig } from './authConfig.js'
import logger from '../lib/logger.js'
import { isSession } from '../lib/context.js'

const BASE_URL = process.env.BASE_URL || ''

export function assertAuthenticatedUser(JWKS: JWTVerifyGetKey) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isUnprotectedRoute(req)) {
        next()
        return
      }

      const session: unknown = res.locals.session ?? (await getSession(req, authConfig))
      const bearerToken = req.headers['authorization']?.toString().replace(/^Bearer\s+/i, '')

      if (isSession(session)) { // User has a authjs session
        next()
        return
      } else if (bearerToken) { // User has a JWT token
        try {
          await jwtVerify(bearerToken, JWKS)
          next()
          return
        } catch (ex) {
          logger.info(ex, 'Authentication failed:')
          res.status(401).send('Unauthorized')
          return
        }
      } else {
        res.redirect(`${BASE_URL}/login`)
        return
      }
    } catch (err) {
      next(err)
      return
    }
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
    const projectRoot = process.cwd()

    // Exclude paths when serving a unbundled project locally
    const localPaths = [
      ...fs.readdirSync(projectRoot).filter((file) => {
        return fs.statSync(path.join(projectRoot, file)).isDirectory()
      }).map((dir) => `${BASE_URL}/${dir}`),

      `${BASE_URL}/@react-refresh`,
      `${BASE_URL}/@vite`
    ]

    return unprotectedRoutes.concat(localPaths)
  }

  return unprotectedRoutes
}

