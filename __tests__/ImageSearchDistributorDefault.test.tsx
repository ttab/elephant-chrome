import type { JSX, ReactNode } from 'react'
import { render, waitFor } from '@testing-library/react'
import type { SearchRequest } from '@ttab/elephant-tt-api/ntb'
import { ImageSearch } from '@/views/ImageSearch'

const { ntbSearch, units } = vi.hoisted(() => ({
  ntbSearch: vi.fn((_request: SearchRequest, _accessToken: string) =>
    Promise.resolve({ response: { data: [], page: { total: 0 } } })
  ),
  units: { current: [] as string[] }
}))

vi.mock('@/hooks/useRegistry', () => ({
  useRegistry: () => ({
    server: { imageSearchUrl: new URL('https://example.com/image-search') },
    envs: { imageSearchProvider: 'ntb' },
    ntb: { search: ntbSearch }
  })
}))

// Mock only useHasUnit: the real `@/hooks` barrel re-exports navigation hooks,
// which would trigger navigation registry init on import.
vi.mock('@/hooks', () => ({
  useHasUnit: (unit: string) => units.current.includes(unit)
}))

// Stub the layout barrel so importing the view doesn't pull in navigation either.
vi.mock('@/components', () => {
  const Pass = ({ children }: { children?: ReactNode }): JSX.Element => <>{children}</>
  return {
    View: { Root: Pass, Content: Pass },
    ViewHeader: { Root: Pass, Title: Pass, Content: Pass, Action: Pass }
  }
})

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', NoopObserver)
  vi.stubGlobal('ResizeObserver', NoopObserver)
})

function firstRequest(): SearchRequest {
  return ntbSearch.mock.calls[0][0]
}

describe('ImageSearch distributor default', () => {
  beforeEach(() => {
    ntbSearch.mockClear()
  })

  it('defaults NPK-unit users to the NPK distributor with outsideSubscription on', async () => {
    units.current = ['/redaktionen-npk']
    render(<ImageSearch />)

    await waitFor(() => expect(ntbSearch).toHaveBeenCalled())
    expect(firstRequest().distributorNames).toEqual(['NPK'])
    expect(firstRequest().outsideSubscription).toBe(true)
  })

  it('defaults other users to no distributor and outsideSubscription off', async () => {
    units.current = []
    render(<ImageSearch />)

    await waitFor(() => expect(ntbSearch).toHaveBeenCalled())
    expect(firstRequest().distributorNames).toEqual([])
    expect(firstRequest().outsideSubscription).toBe(false)
  })
})
