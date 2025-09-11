import { createClient } from 'redis'
import type { RedisClientType } from 'redis'

const BASE_PREFIX = 'elc::hp'

export class Redis {
  readonly #url: string
  #redisClient?: RedisClientType

  constructor(url: string) {
    this.#url = url
    this.#redisClient = undefined
  }

  async connect(): Promise<void> {
    const client = createClient({ url: this.#url })

    await client.connect().catch((ex) => {
      throw new Error('connect to redis', { cause: ex })
    })

    this.#redisClient = client as RedisClientType
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    const cachedDoc = await this.#redisClient?.get(`${BASE_PREFIX}:${key}`)
    if (!cachedDoc) {
      await this.#redisClient?.zAdd(`${BASE_PREFIX}:doc_touched`, { score: Date.now(), value: key })
      return
    }

    const uint8array = new Uint8Array(
      Buffer.from(cachedDoc, 'binary')
    )

    return uint8array
  }

  async store(key: string, state: Buffer): Promise<void> {
    await this.#redisClient?.set(
      `${BASE_PREFIX}:${key}`,
      Buffer.from(state).toString('binary')
    )
  }
}
