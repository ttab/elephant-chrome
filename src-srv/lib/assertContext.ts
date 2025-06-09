import type { User as DefaultUser } from '@auth/express'

interface User extends DefaultUser {
  sub: string
}

export interface Context {
  agent: string
  accessToken: string
  user: User
}

export function assertContext(context: unknown): context is Context {
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
