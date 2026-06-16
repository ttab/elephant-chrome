import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'
import type { EventlogItem } from '@ttab/elephant-api/repository'

import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { useRegistry } from '@/hooks/useRegistry'
import { useRepositoryEvents } from '@/hooks/useRepositoryEvents'

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: vi.fn()
}))

vi.mock('@/hooks/useRepositoryEvents', () => ({
  useRepositoryEvents: vi.fn()
}))

const mockUseRegistry = vi.mocked(useRegistry)
const mockUseRepositoryEvents = vi.mocked(useRepositoryEvents)

const wrapper = ({ children }: { children: ReactNode }) => (
  // Disable cross-test caching so each render does a fresh fetch.
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
)

const makeEvent = (uuid: string): EventlogItem => ({
  id: '1',
  type: 'core/planning-item',
  uuid,
  timestamp: new Date().toISOString(),
  event: '',
  uri: '',
  updaterUri: '',
  language: ''
} as unknown as EventlogItem)

describe('useDeliverableInfo', () => {
  let getDeliverableInfo: ReturnType<typeof vi.fn>
  let lastCallback: ((event: EventlogItem) => void) | undefined

  beforeEach(() => {
    vi.clearAllMocks()
    lastCallback = undefined
    getDeliverableInfo = vi.fn().mockResolvedValue({ planningUuid: 'plan-1' })

    mockUseRegistry.mockReturnValue({
      repository: { getDeliverableInfo }
    } as never)

    mockUseRepositoryEvents.mockImplementation((_eventTypes, callback) => {
      lastCallback = callback as (event: EventlogItem) => void
    })
  })

  it('fetches deliverable info once on mount and exposes planning UUID', async () => {
    const { result } = renderHook(
      () => useDeliverableInfo('deliverable-1'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current?.planningUuid).toBe('plan-1')
    })
    expect(getDeliverableInfo).toHaveBeenCalledTimes(1)
  })

  it('does not refetch when a planning event for an unrelated planning arrives', async () => {
    const { result } = renderHook(
      () => useDeliverableInfo('deliverable-1'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current?.planningUuid).toBe('plan-1')
    })
    expect(getDeliverableInfo).toHaveBeenCalledTimes(1)

    await act(async () => {
      lastCallback?.(makeEvent('plan-other'))
      // give SWR a tick in case it would still revalidate
      await Promise.resolve()
    })

    expect(getDeliverableInfo).toHaveBeenCalledTimes(1)
  })

  it('refetches when a planning event for the linked planning arrives', async () => {
    const { result } = renderHook(
      () => useDeliverableInfo('deliverable-1'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current?.planningUuid).toBe('plan-1')
    })
    expect(getDeliverableInfo).toHaveBeenCalledTimes(1)

    act(() => {
      lastCallback?.(makeEvent('plan-1'))
    })

    await waitFor(() => {
      expect(getDeliverableInfo).toHaveBeenCalledTimes(2)
    })
  })

  it('skips events while the first fetch has not yet resolved', async () => {
    let resolveFetch!: (v: { planningUuid: string }) => void
    const pending = new Promise<{ planningUuid: string }>((resolve) => {
      resolveFetch = resolve
    })
    getDeliverableInfo.mockReturnValueOnce(pending)

    renderHook(() => useDeliverableInfo('deliverable-1'), { wrapper })

    // Event arrives before the fetch resolves: nothing to compare against,
    // so the callback must not trigger a second call.
    act(() => {
      lastCallback?.(makeEvent('plan-1'))
    })

    expect(getDeliverableInfo).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveFetch({ planningUuid: 'plan-1' })
      await Promise.resolve()
    })
  })

  it('does not fetch when deliverableId is empty', () => {
    renderHook(() => useDeliverableInfo(''), { wrapper })
    expect(getDeliverableInfo).not.toHaveBeenCalled()
  })
})
