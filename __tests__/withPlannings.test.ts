import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { HitV1 } from '@ttab/elephant-api/index'
import type { Session } from '@/types/session'
import type { Index } from '@/shared/Index'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))

vi.mock('@/hooks/index/useDocuments/lib/fetch', () => ({ fetch: fetchMock }))

const { withPlannings } = await import('@/hooks/index/useDocuments/lib/withPlannings')

const session = {} as Session
const index = {} as unknown as Index
const hit = (id: string): HitV1 => ({ id, fields: {} }) as unknown as HitV1

describe('withPlannings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not query the index when there are no events (avoids an empty-values terms query -> 500)', async () => {
    const result = await withPlannings({ hits: [], session, index })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result).toEqual([])
  })

  it('queries related plannings with the event ids when events exist', async () => {
    fetchMock.mockResolvedValue([])

    await withPlannings({ hits: [hit('e1'), hit('e2')], session, index })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    // The event ids must be passed as the terms `values`.
    type TermsQuery = {
      conditions: { bool: { must: Array<{ conditions: { terms: { values: string[] } } }> } }
    }
    const [arg] = fetchMock.mock.calls[0] as [{ query: TermsQuery }]
    expect(arg.query.conditions.bool.must[0].conditions.terms.values).toEqual(['e1', 'e2'])
  })
})
