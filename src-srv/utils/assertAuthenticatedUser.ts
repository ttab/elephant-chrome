import { type NextFunction, type Response, type Request } from 'express'
import fs from 'fs'
import path from 'path'
import { jwtVerify, type JWTVerifyGetKey } from 'jose'
import { getSession } from '@auth/express'
import logger from '../lib/logger.js'
import { isSession } from '../lib/context.js'
import type { AuthConfig } from '@auth/core'

export function assertAuthenticatedUser(baseUrl: string, conf: AuthConfig, JWKS: JWTVerifyGetKey) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isUnprotectedRoute(baseUrl, req)) {
        next()
        return
      }

      const session: unknown = res.locals.session ?? (await getSession(req, conf))
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
        res.redirect(`${baseUrl}/login`)
        return
      }
    } catch (err) {
      next(err)
      return
    }
  }
}

export function isUnprotectedRoute(baseUrl: string, req: Request): boolean {
  const unprotectedRoutes = getUnprotectedRoutes(baseUrl)
  return unprotectedRoutes.some((route) => req.path.startsWith(route))
}

function getUnprotectedRoutes(baseUrl: string): string[] {
  const unprotectedRoutes = [
    `${baseUrl}/auth/`,
    `${baseUrl}/init`,
    `${baseUrl}/assets`
  ]

  if (process.env.NODE_ENV === 'development') {
    const projectRoot = process.cwd()

    // Exclude paths when serving a unbundled project locally
    const localPaths = [
      ...fs.readdirSync(projectRoot).filter((file) => {
        return fs.statSync(path.join(projectRoot, file)).isDirectory()
      }).map((dir) => `${baseUrl}/${dir}`),

      `${baseUrl}/@react-refresh`,
      `${baseUrl}/@vite`
    ]

    return unprotectedRoutes.concat(localPaths)
  }

  return unprotectedRoutes
}
