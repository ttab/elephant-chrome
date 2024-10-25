import { type Request, type Response, type NextFunction } from 'express'
import { getSession } from '@auth/express'
import { authConfig } from './authConfig.js'

export function authSession(req: Request, res: Response, next: NextFunction): void {
  getSession(req, authConfig)
    .then(session => {
      res.locals.session = session
      next()
    })
    .catch(error => {
      next(error)
    })
}
