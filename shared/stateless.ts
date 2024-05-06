import { type JWT } from '../src/types'
import { z } from 'zod'

export enum StatelessType {
  AUTH = 'auth',
  MESSAGE = 'message'
}

const StatelessAuthSchema = z.object({
  type: z.enum([StatelessType.AUTH]),
  message: z.object({
    token: z.string(),
    user: z.object({
      iss: z.string(),
      sub: z.string(),
      exp: z.number(),
      sub_name: z.string(),
      scope: z.string(),
      units: z.array(z.string())
    })
  })
})

const StatelessMessageSchema = z.object({
  type: z.enum([StatelessType.MESSAGE]),
  message: z.string()
})

export type StatelessAuth = z.infer<typeof StatelessAuthSchema>
export type StatelessMessage = z.infer<typeof StatelessMessageSchema>

type StatelessPayload = StatelessAuth | StatelessMessage

export function parseStateless<T extends StatelessPayload>(payload: string): T {
  try {
    const [type, message] = payload.split('@')

    switch (type) {
      case StatelessType.AUTH: {
        return StatelessAuthSchema.parse({ type, message: JSON.parse(message) }) as T
      }
      case StatelessType.MESSAGE: {
        return StatelessMessageSchema.parse({ type, message }) as T
      }
      default: {
        throw new Error(`Invalid stateless type: ${type}`)
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Unable to parse stateless message: ${err.message}`)
    }
    throw new Error('Unable to parse stateless message: Unknown error')
  }
}

export function createStateless(prefix: StatelessType.AUTH, message: JWT): string
export function createStateless(prefix: StatelessType.MESSAGE, message: string): string
export function createStateless(prefix: StatelessType, message: string | JWT): string {
  switch (prefix) {
    case StatelessType.AUTH: {
      const { access_token: accessToken, ...rest } = message as JWT
      const payload = {
        token: accessToken,
        user: rest
      }
      return `${prefix as string}@${JSON.stringify(payload)}`
    }

    case StatelessType.MESSAGE: {
      return `${prefix as string}@${JSON.stringify(message)}`
    }

    default: {
      throw new Error(`Invalid stateless type: ${prefix as string}`)
    }
  }
}
