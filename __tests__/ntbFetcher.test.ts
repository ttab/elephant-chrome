import { describe, it, expect, vi } from 'vitest'
import type { Session } from 'next-auth'
import type { SearchRequest } from '@ttab/elephant-tt-api/ntb'
import { createNTBFetcher } from '@/views/ImageSearch/lib/ntbFetcher'
import type { NTB } from '@/shared/NTB'

vi.mock('sonner')

const session = { accessToken: 'token' } as Session

function makeNtb() {
  const search = vi.fn((_request: SearchRequest, _accessToken: string) =>
    Promise.resolve({ response: { data: [], page: { total: 0 } } })
  )
  return { ntb: { search } as unknown as NTB, search }
}

function requestFrom(search: ReturnType<typeof makeNtb>['search']): SearchRequest {
  return search.mock.calls[0][0]
}

describe('createNTBFetcher distributor handling', () => {
  it('omits the distributor filter and keeps outsideSubscription off by default', async () => {
    const { ntb, search } = makeNtb()
    await createNTBFetcher(ntb, session, 'ntb')(['cats', 0, 10, 'image', []])

    const request = requestFrom(search)
    expect(request.distributorNames).toEqual([])
    expect(request.outsideSubscription).toBe(false)
  })

  it('forces outsideSubscription on when a distributor is selected', async () => {
    const { ntb, search } = makeNtb()
    await createNTBFetcher(ntb, session, 'ntb')(['cats', 0, 10, 'image', ['NPK']])

    const request = requestFrom(search)
    expect(request.distributorNames).toEqual(['NPK'])
    expect(request.outsideSubscription).toBe(true)
  })

  it('defaults distributorNames to empty when the key omits it', async () => {
    const { ntb, search } = makeNtb()
    await createNTBFetcher(ntb, session, 'ntb')(['cats', 0, 10, 'image'])

    const request = requestFrom(search)
    expect(request.distributorNames).toEqual([])
    expect(request.outsideSubscription).toBe(false)
  })
})
