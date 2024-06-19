import { getSession } from '@auth/express'
import { type NextFunction, type Response, type Request } from 'express'
import { authConfig } from './authConfig.js'

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


function isUnprotectedRoute(req: Request): boolean {
  const unprotectedRoutes = [
    '/auth/',
    '/init'
  ]

  return unprotectedRoutes.some((route) => req.path.startsWith(route))
}
