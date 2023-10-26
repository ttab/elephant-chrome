import { createClient } from 'redis'
import type { RedisClientType } from 'redis'

export class RedisCache {
  readonly #host: string
  readonly #port: number
  redisClient: RedisClientType

  constructor(host: string, port: number | string) {
    this.#port = typeof port === 'number' ? port : parseInt(port)
    this.#host = host
  }

  get url(): string {
    return `redis://${this.#host}:${this.#port}`
  }

  async connect(): Promise<boolean> {
    const client = createClient({ url: this.url })

    try {
      const result = await client.connect()

      if (result) {
        this.redisClient = client as RedisClientType
        return true
      }

      console.error('Failed connecting to ', this.url)
    } catch (ex: unknown) {
      console.error(ex)
    }

    return false
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    const cachedDoc = await this.redisClient.get(key)

    if (!cachedDoc) {
      return
    }

    const uint8array = new Uint8Array(
      Buffer.from(cachedDoc, 'binary')
    )

    return uint8array
  }

  async store(key: string, state: Buffer): Promise<boolean> {
    try {
      await this.redisClient.set(
        key,
        Buffer.from(state).toString('binary')
      )
      return true
    } catch (ex: unknown) {
      console.error(ex)
    }

    return false
  }
}
