import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'
import { useDocuments } from '@/hooks/index/useDocuments'

const { fetchMock, toastErrorMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  toastErrorMock: vi.fn()
}))

vi.mock('@/hooks/index/useDocuments/lib/fetch', () => ({
  fetch: fetchMock
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({
    index: {},
    repository: {}
  })
}))

vi.mock('@/hooks/useTable', () => ({
  useTable: () => ({ setData: vi.fn() })
}))

vi.mock('sonner', () => ({
  toast: { error: toastErrorMock }
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), errorRetryCount: 0, dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
)

describe('useDocuments error logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs the failure once per failed fetch, not on every re-render', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValue(
      new Error('Unable to query index: invalid authorization: invalid token: token has invalid claims: token is expired')
    )

    const { rerender } = renderHook(
      ({ type }: { type: string }) => useDocuments({ documentType: type }),
      { wrapper, initialProps: { type: 'core/article' } }
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    rerender({ type: 'core/article' })
    rerender({ type: 'core/article' })
    rerender({ type: 'core/article' })

    const documentFetchErrors = consoleErrorSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].includes('Document fetch failed')
    )

    expect(documentFetchErrors).toHaveLength(1)
    expect(toastErrorMock).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })

  it('logs once across multiple consumers sharing the same cache key', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValue(new Error('boom'))

    const cache = new Map()
    const sharedWrapper = ({ children }: { children: ReactNode }) => (
      <SWRConfig value={{ provider: () => cache, errorRetryCount: 0, dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    )

    renderHook(
      () => {
        useDocuments({ documentType: 'core/article' })
        useDocuments({ documentType: 'core/article' })
        useDocuments({ documentType: 'core/article' })
      },
      { wrapper: sharedWrapper }
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const documentFetchErrors = consoleErrorSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].includes('Document fetch failed')
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(documentFetchErrors).toHaveLength(1)
    expect(toastErrorMock).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })
})
