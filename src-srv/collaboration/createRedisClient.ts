import { Redis as IORedis } from 'ioredis'
import logger from '../lib/logger.js'

export const createRedisClient = (redisUrl: URL): IORedis => {
  const { hostname, port, username, password, protocol } = redisUrl

  const client = new IORedis({
    host: hostname,
    port: parseInt(port, 10),
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    ...(protocol === 'rediss:' ? { tls: { rejectUnauthorized: true } } : {})
  })

  client.on('error', (err: Error) => {
    logger.error({ err, host: hostname, port }, 'Hocuspocus Redis pubsub error')
  })

  return client
}
