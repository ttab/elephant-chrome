import { type Request, type Response, type NextFunction } from 'express'
import { getSession } from '@auth/express'
import { authConfig } from './authConfig.js'
import { isUnprotectedRoute } from './assertAuthenticatedUser.js'

export function authSession(req: Request, res: Response, next: NextFunction): void {
  if (isUnprotectedRoute(req)) {
    next()
  }

  getSession(req, authConfig)
    .then(session => {
      res.locals.session = session
      next()
    })
    .catch(error => {
      next(error)
    })
}
