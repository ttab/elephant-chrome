import { assertContext, type Context } from './assertContext.js'

export const getContext = (session: unknown, agent: 'server' | {} & string = 'server'): Context | {
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
    agent
  }

  if (!assertContext(context)) {
    return {
      statusCode: 500,
      statusMessage: 'Invalid context provided, there is something wrong with the session.'
    }
  }

  return context
}

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
