import { Redis as IORedis } from 'ioredis'
import { instrumentRedisClient, type RedisHealth } from '../utils/redisHealth.js'

export interface PubsubClient {
  client: IORedis
  health: RedisHealth
}

export const createRedisClient = (redisUrl: URL): PubsubClient => {
  const { hostname, port, username, password, protocol } = redisUrl

  const client = new IORedis({
    host: hostname,
    port: parseInt(port, 10),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    ...(protocol === 'rediss:' ? { tls: { rejectUnauthorized: true } } : {})
  })

  const health = instrumentRedisClient(client, 'redis-pubsub', { host: hostname, port })
  return { client, health }
}
