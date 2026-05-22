import { renderHook, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'
import { useWorkflowStatus } from '@/hooks/useWorkflowStatus'

const { getMetaMock, toastErrorMock } = vi.hoisted(() => ({
  getMetaMock: vi.fn(),
  toastErrorMock: vi.fn()
}))

vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<object>('@/hooks')
  return {
    ...actual,
    useRegistry: () => ({
      repository: { getMeta: getMetaMock }
    }),
    useRepositoryEvents: () => undefined
  }
})

vi.mock('sonner', () => ({
  toast: { error: toastErrorMock }
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), errorRetryCount: 0, dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
)

const documentId = '11111111-1111-1111-1111-111111111111'

describe('useWorkflowStatus error logging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs the failure once per failed fetch, not on every re-render', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getMetaMock.mockRejectedValue(
      new Error('Unable to fetch documents meta: received HTTP 401, unable to read response body as json')
    )

    const { rerender } = renderHook(
      ({ id }: { id: string }) => useWorkflowStatus({ documentId: id }),
      { wrapper, initialProps: { id: documentId } }
    )

    await waitFor(() => {
      expect(getMetaMock).toHaveBeenCalled()
    })

    rerender({ id: documentId })
    rerender({ id: documentId })
    rerender({ id: documentId })

    const documentStatusErrors = consoleErrorSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].includes('Unable to get documentStatus')
    )

    expect(documentStatusErrors).toHaveLength(1)
    expect(toastErrorMock).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })

  it('logs once across multiple consumers sharing the same cache key', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    getMetaMock.mockRejectedValue(new Error('boom'))

    const cache = new Map()
    const sharedWrapper = ({ children }: { children: ReactNode }) => (
      <SWRConfig value={{ provider: () => cache, errorRetryCount: 0, dedupingInterval: 0 }}>
        {children}
      </SWRConfig>
    )

    renderHook(
      () => {
        useWorkflowStatus({ documentId })
        useWorkflowStatus({ documentId })
        useWorkflowStatus({ documentId })
      },
      { wrapper: sharedWrapper }
    )

    await waitFor(() => {
      expect(getMetaMock).toHaveBeenCalled()
    })

    const documentStatusErrors = consoleErrorSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].includes('Unable to get documentStatus')
    )

    expect(getMetaMock).toHaveBeenCalledTimes(1)
    expect(documentStatusErrors).toHaveLength(1)
    expect(toastErrorMock).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })
})
