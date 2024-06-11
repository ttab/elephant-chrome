import { getSession } from '@auth/express'
import { type NextFunction, type Response, type Request } from 'express'
import { authConfig } from './authConfig.js'

export async function authenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = res.locals.session ?? (await getSession(req, authConfig))

  if (req.path === `${process.env.BASE_URL}/api/auth/signin`) {
    next()
    return
  }

  if (!session?.user) {
    res.redirect(`${process.env.BASE_URL}/api/auth/signin`)
  } else {
    next()
  }
}
