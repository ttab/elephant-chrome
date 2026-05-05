import type EventEmitter from 'node:events'
import logger from '../lib/logger.js'

interface Endpoint {
  host: string
  port: number
}

export const instrumentRedisClient = (
  client: EventEmitter,
  label: string,
  endpoint: Endpoint
): void => {
  let downSince: number | null = null

  client.on('error', (err: Error) => {
    if (downSince !== null) return
    downSince = Date.now()
    const loggedErr = err instanceof AggregateError && err.errors[0] instanceof Error
      ? err.errors[0]
      : err
    logger.error({ err: loggedErr, ...endpoint, label }, `${label} entered error state`)
  })

  client.on('ready', () => {
    if (downSince === null) return
    const downForMs = Date.now() - downSince
    downSince = null
    logger.info({ ...endpoint, label, downForMs }, `${label} recovered`)
  })
}
