import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest'

vi.mock('ioredis', () => ({
  Redis: vi.fn()
}))

vi.mock('../../src-srv/lib/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}))

import { Redis as IORedis } from 'ioredis'
import logger from '../../src-srv/lib/logger.js'
import { createRedisClient } from '../../src-srv/collaboration/createRedisClient.js'

describe('createRedisClient', () => {
  let mockClient: { on: Mock }

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = { on: vi.fn() }
    ;(IORedis as unknown as Mock).mockImplementation(function () {
      return mockClient
    })
  })

  test('parses redis:// URL into ioredis options with credentials', () => {
    createRedisClient(new URL('redis://user:pw@cache:6379'))
    expect(IORedis).toHaveBeenCalledWith({
      host: 'cache',
      port: 6379,
      username: 'user',
      password: 'pw'
    })
  })

  test('omits username/password when absent', () => {
    createRedisClient(new URL('redis://cache:6379'))
    expect(IORedis).toHaveBeenCalledWith({
      host: 'cache',
      port: 6379
    })
  })

  test('rediss:// URL enables TLS', () => {
    createRedisClient(new URL('rediss://cache:6380'))
    expect(IORedis).toHaveBeenCalledWith({
      host: 'cache',
      port: 6380,
      tls: { rejectUnauthorized: true }
    })
  })

  test('returns a fresh client per invocation (Hocuspocus pub+sub contract)', () => {
    const clients: { on: Mock }[] = []
    ;(IORedis as unknown as Mock).mockImplementation(function () {
      const fresh = { on: vi.fn() }
      clients.push(fresh)
      return fresh
    })

    const a = createRedisClient(new URL('redis://cache:6379'))
    const b = createRedisClient(new URL('redis://cache:6379'))

    expect(IORedis).toHaveBeenCalledTimes(2)
    expect(clients).toHaveLength(2)
    expect(a).not.toBe(b)
  })

  test('attaches error listener that logs with err/host/port', () => {
    createRedisClient(new URL('redis://cache:6379'))
    const calls = mockClient.on.mock.calls as Array<[string, (err: Error) => void]>
    const errorCall = calls.find(([event]) => event === 'error')
    expect(errorCall).toBeDefined()
    const err = new Error('boom')
    errorCall![1](err)
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err, label: 'redis-pubsub', host: 'cache', port: '6379' }),
      'redis-pubsub entered error state'
    )
  })
})
