import { createClient } from 'redis'
import type { RedisClientType } from 'redis'

export class RedisCache {
  readonly #url: string
  redisClient?: RedisClientType

  constructor(url: string) {
    this.#url = url
    this.redisClient = undefined
  }

  async connect(): Promise<boolean> {
    const client = createClient({ url: this.#url })

    try {
      const result = await client.connect()

      if (result) {
        this.redisClient = client as RedisClientType
        return true
      }

      console.error('Failed connecting to ', this.#url)
    } catch (ex: unknown) {
      console.error(ex)
    }

    return false
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    try {
      const cachedDoc = await this.redisClient?.get(`elc::hp:${key}`)
      if (!cachedDoc) {
        return
      }

      const uint8array = new Uint8Array(
        Buffer.from(cachedDoc, 'binary')
      )

      return uint8array
    } catch (ex: unknown) {
      console.error(ex)
    }
  }

  async store(key: string, state: Buffer): Promise<boolean> {
    try {
      await this.redisClient?.set(
        `elc::hp:${key}`,
        Buffer.from(state).toString('binary')
      )
      return true
    } catch (ex: unknown) {
      console.error(ex)
    }

    return false
  }
}
