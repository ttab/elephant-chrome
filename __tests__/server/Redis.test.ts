import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import { Redis } from '../../src-srv/utils/Redis'

// Mock the redis module
vi.mock('redis', () => ({
  createClient: vi.fn()
}))

// Mock the logger
vi.mock('../../src-srv/lib/logger.js', () => ({
  default: {
    error: vi.fn()
  }
}))

import { createClient } from 'redis'
import logger from '../../src-srv/lib/logger.js'

describe('Redis', () => {
  let mockClient: {
    on: Mock
    connect: Mock
    get: Mock
    set: Mock
    zAdd: Mock
    keys: Mock
    exists: Mock
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockClient = {
      on: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      set: vi.fn(),
      zAdd: vi.fn(),
      keys: vi.fn(),
      exists: vi.fn()
    }

    ;(createClient as Mock).mockReturnValue(mockClient)
  })

  describe('connect', () => {
    it('creates client with correct URL', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      expect(createClient).toHaveBeenCalledWith({ url: 'redis://localhost:6379' })
    })

    it('attaches error handler before connecting', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      // Error handler should be attached before connect is called
      const onCallOrder = mockClient.on.mock.invocationCallOrder[0]
      const connectCallOrder = mockClient.connect.mock.invocationCallOrder[0]
      expect(onCallOrder).toBeLessThan(connectCallOrder)

      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('error handler logs with host and port context', async () => {
      const redis = new Redis('redis://myhost:6380')
      await redis.connect()

      // Get the error handler that was registered
      const errorHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1] as (err: Error) => void

      const testError = new Error('Connection refused')
      errorHandler(testError)

      expect(logger.error).toHaveBeenCalledWith(
        { err: testError, host: 'myhost', port: '6380' },
        'Redis cache connection error'
      )
    })

    it('throws when connection fails', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'))

      const redis = new Redis('redis://localhost:6379')

      await expect(redis.connect()).rejects.toThrow('connect to redis')
    })
  })

  describe('get', () => {
    it('returns Uint8Array when key exists', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      const binaryData = Buffer.from([1, 2, 3, 4]).toString('binary')
      mockClient.get.mockResolvedValue(binaryData)

      const result = await redis.get('doc123')

      expect(mockClient.get).toHaveBeenCalledWith('elc::hp:doc123')
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]))
    })

    it('returns undefined and updates zAdd when key is missing', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      mockClient.get.mockResolvedValue(null)

      const result = await redis.get('missing-doc')

      expect(result).toBeUndefined()
      expect(mockClient.zAdd).toHaveBeenCalledWith(
        'elc::hp:doc_touched',
        expect.objectContaining({
          score: expect.any(Number),
          value: 'missing-doc'
        })
      )
    })
  })

  describe('setEx', () => {
    it('sets value with expiration', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      await redis.setEx('cache-key', 'cached-value', 3600)

      expect(mockClient.set).toHaveBeenCalledWith(
        'elc::hp:cache-key',
        'cached-value',
        { EX: 3600 }
      )
    })
  })

  describe('keys', () => {
    it('returns array of matching keys', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      mockClient.keys.mockResolvedValue(['elc::hp:doc1', 'elc::hp:doc2'])

      const result = await redis.keys('doc*')

      expect(mockClient.keys).toHaveBeenCalledWith('elc::hp:doc*')
      expect(result).toEqual(['elc::hp:doc1', 'elc::hp:doc2'])
    })

    it('returns empty array when no matches', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      mockClient.keys.mockResolvedValue([])

      const result = await redis.keys('nonexistent*')

      expect(result).toEqual([])
    })
  })

  describe('store', () => {
    it('stores Buffer as binary string', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      const data = Buffer.from([0x00, 0x01, 0x02, 0xff])
      await redis.store('doc-state', data)

      expect(mockClient.set).toHaveBeenCalledWith(
        'elc::hp:doc-state',
        data.toString('binary')
      )
    })
  })

  describe('exists', () => {
    it('returns true when key exists', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      mockClient.exists.mockResolvedValue(1)

      const result = await redis.exists('existing-key')

      expect(mockClient.exists).toHaveBeenCalledWith('elc::hp:existing-key')
      expect(result).toBe(true)
    })

    it('returns false when key does not exist', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      mockClient.exists.mockResolvedValue(0)

      const result = await redis.exists('missing-key')

      expect(result).toBe(false)
    })

    it('returns false when exists returns undefined', async () => {
      const redis = new Redis('redis://localhost:6379')
      await redis.connect()

      mockClient.exists.mockResolvedValue(undefined)

      const result = await redis.exists('unknown-key')

      expect(result).toBe(false)
    })
  })

  describe('prefix', () => {
    it('returns the base prefix', () => {
      const redis = new Redis('redis://localhost:6379')

      expect(redis.prefix).toBe('elc::hp')
    })
  })
})
