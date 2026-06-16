import EventEmitter from 'node:events'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../src-srv/lib/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}))

import logger from '../../src-srv/lib/logger.js'
import { instrumentRedisClient } from '../../src-srv/utils/redisHealth.js'

afterEach(() => vi.clearAllMocks())

describe('instrumentRedisClient', () => {
  test('logs error once on first failure and suppresses subsequent ones', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: 1 })

    client.emit('error', new Error('boom'))
    client.emit('error', new Error('still boom'))
    client.emit('error', new Error('still still boom'))

    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  test('logs recovery on ready event after error and re-arms latch', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: 1 })

    client.emit('error', new Error('boom'))
    client.emit('ready')

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'cache', downForMs: expect.any(Number) as number }),
      expect.stringContaining('recovered')
    )

    client.emit('error', new Error('boom2'))
    expect(logger.error).toHaveBeenCalledTimes(2)
  })

  test('does not log ready when never errored', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: 1 })
    client.emit('ready')
    expect(logger.info).not.toHaveBeenCalled()
  })

  test('unwraps AggregateError to surface the inner error', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: 1 })

    const inner = new Error('connect ECONNREFUSED 127.0.0.1:6379')
    const aggregate = new AggregateError([inner], '')
    client.emit('error', aggregate)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: inner, label: 'cache' }),
      'cache entered error state'
    )
  })

  test('logs AggregateError as-is when it has no inner errors', () => {
    const client = new EventEmitter()
    instrumentRedisClient(client, 'cache', { host: 'h', port: 1 })

    const aggregate = new AggregateError([], 'no inners')
    client.emit('error', aggregate)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: aggregate, label: 'cache' }),
      'cache entered error state'
    )
  })
})
