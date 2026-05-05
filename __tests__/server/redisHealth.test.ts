import EventEmitter from 'node:events'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../src-srv/lib/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}))

import logger from '../../src-srv/lib/logger.js'
import { instrumentRedisClient } from '../../src-srv/utils/redisHealth.js'

afterEach(() => vi.clearAllMocks())

describe('instrumentRedisClient', () => {
  test('logs error once on first failure and reports unhealthy', () => {
    const client = new EventEmitter()
    const health = instrumentRedisClient(client, 'cache', { host: 'h', port: '1' })

    expect(health.isHealthy()).toBe(true)

    client.emit('error', new Error('boom'))
    client.emit('error', new Error('still boom'))
    client.emit('error', new Error('still still boom'))

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(health.isHealthy()).toBe(false)
  })

  test('logs recovery on ready event after error', () => {
    const client = new EventEmitter()
    const health = instrumentRedisClient(client, 'cache', { host: 'h', port: '1' })

    client.emit('error', new Error('boom'))
    expect(health.isHealthy()).toBe(false)

    client.emit('ready')
    expect(health.isHealthy()).toBe(true)
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'cache', downForMs: expect.any(Number) as number }),
      expect.stringContaining('recovered')
    )

    // After recovery, the next error logs again (re-arms the latch).
    client.emit('error', new Error('boom2'))
    expect(logger.error).toHaveBeenCalledTimes(2)
  })

  test('does not log ready when already healthy', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: '1' })
    client.emit('ready')
    expect(logger.info).not.toHaveBeenCalled()
  })

  test('logs terminal disconnect on end event after error', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: '1' })

    const err = new Error('Redis cache reconnect attempts exhausted')
    client.emit('error', err)
    client.emit('end')

    expect(logger.error).toHaveBeenCalledTimes(2)
    expect(logger.error).toHaveBeenLastCalledWith(
      expect.objectContaining({ err, label: 'cache', downForMs: expect.any(Number) as number }),
      'cache permanently disconnected'
    )
  })

  test('does not log on end event during graceful shutdown', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: '1' })
    client.emit('end')
    expect(logger.error).not.toHaveBeenCalled()
  })
})
