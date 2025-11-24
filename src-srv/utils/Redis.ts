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

  async setEx(key: string, value: string, ttl: number): Promise<void> {
    await this.#redisClient?.set(
      `${BASE_PREFIX}:${key}`,
      value,
      { EX: ttl }
    )
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.#redisClient?.keys(`${BASE_PREFIX}:${pattern}`) || []
  }

  async store(key: string, state: Buffer): Promise<void> {
    await this.#redisClient?.set(
      `${BASE_PREFIX}:${key}`,
      Buffer.from(state).toString('binary')
    )
  }

  async exists(key: string): Promise<boolean> {
    const existsCount = await this.#redisClient?.exists(`${BASE_PREFIX}:${key}`)

    return existsCount != undefined && existsCount > 0
  }

  get prefix(): string {
    return BASE_PREFIX
  }
}
