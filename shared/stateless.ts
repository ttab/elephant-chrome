import { z } from 'zod'

export enum StatelessType {
  AUTH = 'auth',
  IN_PROGRESS = 'inProgress',
  MESSAGE = 'message'
}

const StatelessAuthSchema = z.object({
  type: z.enum([StatelessType.AUTH]),
  message: z.object({
    token: z.string()
  })
})

const StatelessMessageSchema = z.object({
  type: z.enum([StatelessType.MESSAGE]),
  message: z.string()
})

const StatelessInProgressMessageSchema = z.object({
  state: z.boolean(),
  id: z.string(),
  context: z.any()
})

const StateLessInProgressSchema = z.object({
  type: z.enum([StatelessType.IN_PROGRESS]),
  message: StatelessInProgressMessageSchema
})


export type StatelessAuth = z.infer<typeof StatelessAuthSchema>
export type StatelessMessage = z.infer<typeof StatelessMessageSchema>
export type StatelessInProgress = z.infer<typeof StateLessInProgressSchema>
type StatelessInProgressMessage = z.infer<typeof StatelessInProgressMessageSchema>

type StatelessPayload = StatelessAuth | StatelessMessage | StatelessInProgress

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

      case StatelessType.IN_PROGRESS: {
        return StateLessInProgressSchema.parse({ type, message: JSON.parse(message) }) as T
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

export function createStateless(prefix: StatelessType.IN_PROGRESS, message: StatelessInProgressMessage): string
export function createStateless(prefix: StatelessType.AUTH, message: string): string
export function createStateless(prefix: StatelessType.MESSAGE, message: string): string
export function createStateless(prefix: StatelessType, message: string | StatelessInProgressMessage): string {
  switch (prefix) {
    case StatelessType.AUTH: {
      const payload = {
        token: message
        // TODO: Send user
      }
      return `${prefix as string}@${JSON.stringify(payload)}`
    }

    case StatelessType.MESSAGE: {
      return `${prefix as string}@${JSON.stringify(message)}`
    }

    case StatelessType.IN_PROGRESS: {
      return `${prefix as string}@${JSON.stringify(message)}`
    }

    default: {
      throw new Error(`Invalid stateless type: ${prefix as string}`)
    }
  }
}
