import { Redis as IORedis } from 'ioredis'
import { instrumentRedisClient } from '../utils/redisHealth.js'

export const createRedisClient = (redisUrl: URL): IORedis => {
  const { hostname, port, username, password, protocol } = redisUrl
  const portNumber = parseInt(port, 10)

  const client = new IORedis({
    host: hostname,
    port: portNumber,
    // Pub/sub clients don't need the loading-from-disk check, and the INFO it
    // sends can fail with "only SUBSCRIBE/UNSUBSCRIBE/PING/QUIT/RESET allowed
    // in this context" if the connection enters subscribe mode before the
    // check completes (e.g. on Hocuspocus reconnect with auto-resubscribe).
    enableReadyCheck: false,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
    ...(protocol === 'rediss:' ? { tls: { rejectUnauthorized: true } } : {})
  })

  instrumentRedisClient(client, 'redis-pubsub', { host: hostname, port: portNumber })

  return client
}
