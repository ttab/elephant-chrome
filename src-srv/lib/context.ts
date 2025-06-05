import type { User as DefaultUser } from '@auth/express'

interface User extends DefaultUser {
  sub: string
}

export interface Context {
  agent: string
  accessToken: string
  user: User
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
const isSession = (value: unknown): value is {
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
