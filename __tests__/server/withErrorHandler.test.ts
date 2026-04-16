import { describe, it, expect, vi } from 'vitest'
import { withErrorHandler } from '../../src-srv/lib/errorHandler.js'
import type { Extension } from '@hocuspocus/server'

interface TestExtension extends Extension {
  onAuthenticate: () => Promise<{ user: string, accessToken: string }>
}

interface PropsExtension extends Extension {
  priority: number
  extName: string
}

describe('withErrorHandler', () => {
  it('returns value when extension method succeeds', async () => {
    const extension: TestExtension = {
      onAuthenticate: () => Promise.resolve({ user: 'test-user', accessToken: 'token' })
    }

    const errorHandler = { error: vi.fn() }
    const [wrapped] = withErrorHandler([extension], errorHandler as never)

    const result = await (wrapped as TestExtension).onAuthenticate()

    expect(result).toEqual({ user: 'test-user', accessToken: 'token' })
    expect(errorHandler.error).not.toHaveBeenCalled()
  })

  it('logs error and re-throws when extension method fails', async () => {
    const testError = new Error('Auth failed')
    const extension: TestExtension = {
      onAuthenticate: () => Promise.reject(testError)
    }

    const errorHandler = { error: vi.fn() }
    const [wrapped] = withErrorHandler([extension], errorHandler as never)

    await expect((wrapped as TestExtension).onAuthenticate())
      .rejects.toThrow('Auth failed')

    expect(errorHandler.error).toHaveBeenCalledWith(testError)
  })

  it('preserves non-function properties', () => {
    const extension: PropsExtension = {
      priority: 100,
      extName: 'TestExtension'
    }

    const errorHandler = { error: vi.fn() }
    const [wrapped] = withErrorHandler([extension], errorHandler as never)

    expect((wrapped as PropsExtension).priority).toBe(100)
    expect((wrapped as PropsExtension).extName).toBe('TestExtension')
  })
})
