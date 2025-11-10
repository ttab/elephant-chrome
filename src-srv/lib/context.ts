import type { User as DefaultUser } from '@auth/express'
import type { Request, Response } from 'express'

interface User extends DefaultUser {
  sub: string
}

export interface Context {
  agent: string
  accessToken: string
  user: User
  type?: string
  invisible?: boolean

  // Is set to true when redis cache already loaded document
  loadedFromCache?: boolean

  // Is set to true when a user has disconnected from a document
  disconnected?: boolean
}

/**
* Create and return a context (i.e Session plus agent set to 'server') or return valid http error.
*/
export const getContextFromValidSession = (session: unknown): Context | {
  statusCode: number
  statusMessage: string
} => {
  if (!isSession(session)) {
    return {
      statusCode: 401,
      statusMessage: 'Unauthorized: Valid session not found'
    }
  }

  const context: Context = {
    accessToken: session.accessToken,
    user: session.user,
    agent: 'server'
  }

  if (!isContext(context)) {
    return {
      statusCode: 500,
      statusMessage: 'Invalid context provided, there is something wrong with the session.'
    }
  }

  return context
}

/**
 * Type guard for Context
 */
export function isContext(context: unknown): context is Context {
  return (
    typeof context === 'object'
    && context !== null

    && 'agent' in context
    && (context.agent === 'server' || context.agent === 'user')

    && 'accessToken' in context
    && typeof context.accessToken === 'string'

    && 'user' in context
    && typeof context.user === 'object'
    && context.user !== null

    && 'sub' in context.user
    && typeof context.user.sub === 'string'
  )
}

/**
 * Local type guard for session
 */
export const isSession = (value: unknown): value is {
  accessToken: string
  user: Context['user']
} => {
  return !!value
    && typeof value === 'object'
    && 'accessToken' in value
    && typeof value.accessToken === 'string'
    && 'user' in value
    && !!value.user
}


export function getSession(req: Request, res: Response): { accessToken?: string, user?: User | undefined } {
  // Try to get token and user from session
  const session: unknown = res.locals?.session

  if (isSession(session)) {
    return {
      accessToken: (session as { accessToken?: string }).accessToken,
      user: (session as { user?: User }).user
    }
  }

  // Try to get token and user from headers (e.g., Authorization: Bearer <token>, X-User: <user>)
  const authHeader = req.headers['authorization']
  const userHeader = req.headers['x-user']

  let user: unknown = undefined
  if (typeof userHeader === 'string') {
    try {
      user = JSON.parse(userHeader)
    } catch {
      user = undefined
    }
  }

  return {
    accessToken: typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : undefined,
    user: user as User
  }
}
