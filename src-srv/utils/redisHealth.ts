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
  let lastError: Error | undefined

  client.on('error', (err: Error) => {
    lastError = err
    if (downSince !== null) return
    downSince = Date.now()
    logger.error({ err, host, port, label }, `${label} entered error state`)
  })

  client.on('ready', () => {
    if (downSince === null) return
    const downForMs = Date.now() - downSince
    downSince = null
    lastError = undefined
    logger.info({ label, host, port, downForMs }, `${label} recovered`)
  })

  client.on('end', () => {
    if (downSince === null) return
    const downForMs = Date.now() - downSince
    logger.error(
      { err: lastError, label, host, port, downForMs },
      `${label} permanently disconnected`
    )
  })

  return {
    isHealthy: () => downSince === null
  }
}
