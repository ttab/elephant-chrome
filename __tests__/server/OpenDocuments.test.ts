import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../src-srv/lib/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}))

import type { Hocuspocus, onConfigurePayload } from '@hocuspocus/server'
import logger from '../../src-srv/lib/logger.js'
import { OpenDocuments } from '../../src-srv/collaboration/extensions/OpenDocuments.js'
import type { Redis } from '../../src-srv/utils/Redis.js'

const makeRedisStub = () => {
  const setEx = vi.fn().mockResolvedValue(undefined)
  const keys = vi.fn().mockResolvedValue([])
  const stub = {
    connect: vi.fn().mockResolvedValue(undefined),
    setEx,
    keys,
    prefix: 'elc::hp'
  } as unknown as Redis
  return { stub, setEx, keys }
}

const makeInstanceStub = () => {
  const transact = vi.fn().mockResolvedValue(undefined)
  return {
    openDirectConnection: vi.fn().mockResolvedValue({ transact })
  }
}

describe('OpenDocuments interval error handling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('routes heartbeat-interval failure to logger.error with instanceId/count', async () => {
    const { stub, setEx } = makeRedisStub()
    const instance = makeInstanceStub()
    const openDocs = new OpenDocuments({ redis: stub })

    await openDocs.onConfigure({ instance: instance as unknown as Hocuspocus } as onConfigurePayload)

    setEx.mockRejectedValueOnce(new Error('redis down'))

    await vi.advanceTimersByTimeAsync(30000)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error) as Error,
        instanceId: expect.any(String) as string,
        count: expect.any(Number) as number
      }),
      'OpenDocuments heartbeat update failed'
    )
  })

  test('routes cleanup-interval failure to logger.error with instanceId', async () => {
    const { stub, keys } = makeRedisStub()
    const instance = makeInstanceStub()
    const openDocs = new OpenDocuments({ redis: stub })

    await openDocs.onConfigure({ instance: instance as unknown as Hocuspocus } as onConfigurePayload)

    keys.mockRejectedValueOnce(new Error('redis down'))

    // Cleanup interval is 60000 + Math.random()*20000, so 80000ms guarantees a fire.
    await vi.advanceTimersByTimeAsync(80000)

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error) as Error,
        instanceId: expect.any(String) as string
      }),
      'OpenDocuments dead-connection cleanup failed'
    )
  })
})
