import { type Request, type Response, type NextFunction } from 'express'
import { getSession } from '@auth/express'
import { isUnprotectedRoute } from './assertAuthenticatedUser.js'
import type { AuthConfig } from '@auth/core'

export function authSessionMiddleware(
  baseUrl: string, conf: AuthConfig
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isUnprotectedRoute(baseUrl, req)) {
      next()
    } else {
      getSession(req, conf)
        .then((session) => {
          res.locals.session = session
          next()
        })
        .catch((error) => {
          next(error)
        })
    }
  }
}
