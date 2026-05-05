import { Redis as IORedis } from 'ioredis'
import { instrumentRedisClient } from '../utils/redisHealth.js'

export const createRedisClient = (redisUrl: URL): IORedis => {
  const { hostname, port, username, password, protocol } = redisUrl
  const portNumber = parseInt(port, 10)

  const client = new IORedis({
    host: hostname,
    port: portNumber,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    ...(protocol === 'rediss:' ? { tls: { rejectUnauthorized: true } } : {})
  })

  instrumentRedisClient(client, 'redis-pubsub', { host: hostname, port: portNumber })

  return client
}
