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
    logger.error({ err, ...endpoint, label }, `${label} entered error state`)
  })

  client.on('ready', () => {
    if (downSince === null) return
    const downForMs = Date.now() - downSince
    downSince = null
    logger.info({ ...endpoint, label, downForMs }, `${label} recovered`)
  })
}
