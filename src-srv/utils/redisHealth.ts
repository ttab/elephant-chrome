import type EventEmitter from 'node:events'
import logger from '../lib/logger.js'

export interface RedisHealth {
  isHealthy: () => boolean
}

interface Endpoint {
  host: string
  port: string
}

export const instrumentRedisClient = (
  client: EventEmitter,
  label: string,
  { host, port }: Endpoint
): RedisHealth => {
  let downSince: number | null = null

  client.on('error', (err: Error) => {
    if (downSince !== null) return
    downSince = Date.now()
    logger.error({ err, host, port, label }, `${label} entered error state`)
  })

  client.on('ready', () => {
    if (downSince === null) return
    const downForMs = Date.now() - downSince
    downSince = null
    logger.info({ label, host, port, downForMs }, `${label} recovered`)
  })

  return {
    isHealthy: () => downSince === null
  }
}
