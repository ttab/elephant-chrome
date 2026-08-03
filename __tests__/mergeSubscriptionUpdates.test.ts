import { describe, it, expect } from 'vitest'
import { SortingV1 } from '@ttab/elephant-api/index'
import type { HitV1, SubscriptionItem } from '@ttab/elephant-api/index'
import { mergeSubscriptionUpdates } from '@/hooks/index/useDocuments/lib/mergeSubscriptionUpdates'

// Wires are sorted newest-first by the document's modified time.
const sort = [SortingV1.create({ field: 'modified', desc: true })]

const hit = (
  id: string,
  modified: string,
  extra: Record<string, { values: string[] }> = {}
): HitV1 => ({ id, fields: { modified: { values: [modified] }, ...extra } }) as unknown as HitV1

const matched = (
  id: string,
  modified: string,
  extra: Record<string, { values: string[] }> = {}
): SubscriptionItem =>
  ({ id, match: true, fields: { modified: { values: [modified] }, ...extra } }) as unknown as SubscriptionItem

const ids = (hits: HitV1[]) => hits.map((h) => h.id)

describe('mergeSubscriptionUpdates', () => {
  it('moves a wire to the top when a new version bumps its modified time', () => {
    const data = [
      hit('a', '2026-07-03T10:00:00.000Z'),
      hit('b', '2026-07-03T09:00:00.000Z'),
      hit('c', '2026-07-03T08:00:00.000Z')
    ]

    // 'c' receives a new version and is now the most recently modified.
    const result = mergeSubscriptionUpdates(data, [matched('c', '2026-07-03T11:00:00.000Z')], sort)

    expect(ids(result)).toEqual(['c', 'a', 'b'])
  })

  it('re-sorts an updated wire down when its modified time is older than others', () => {
    const data = [
      hit('a', '2026-07-03T10:00:00.000Z'),
      hit('b', '2026-07-03T09:00:00.000Z')
    ]

    // 'a' updated but still (say) with a modified between b and nothing -> stays first here;
    // 'b' updated to be newest -> should jump above 'a'.
    const result = mergeSubscriptionUpdates(data, [matched('b', '2026-07-03T12:00:00.000Z')], sort)

    expect(ids(result)).toEqual(['b', 'a'])
  })

  it('keeps position for a status-only update where modified is unchanged', () => {
    const data = [
      hit('a', '2026-07-03T10:00:00.000Z'),
      hit('b', '2026-07-03T09:00:00.000Z', { 'heads.read.version': { values: ['0'] } })
    ]

    // 'b' marked read: only heads.read.version changes, modified is unchanged.
    const result = mergeSubscriptionUpdates(
      data,
      [matched('b', '2026-07-03T09:00:00.000Z', { 'heads.read.version': { values: ['3'] } })],
      sort
    )

    expect(ids(result)).toEqual(['a', 'b'])
    expect(result[1].fields['heads.read.version']?.values?.[0]).toBe('3')
  })

  it('patches the updated fields onto the matched wire', () => {
    const data = [hit('a', '2026-07-03T10:00:00.000Z')]

    const result = mergeSubscriptionUpdates(data, [matched('a', '2026-07-03T12:00:00.000Z')], sort)

    expect(result[0].fields.modified?.values?.[0]).toBe('2026-07-03T12:00:00.000Z')
  })

  it('leaves order untouched when no sort is provided', () => {
    const data = [
      hit('a', '2026-07-03T08:00:00.000Z'),
      hit('b', '2026-07-03T10:00:00.000Z')
    ]

    const result = mergeSubscriptionUpdates(data, [matched('a', '2026-07-03T12:00:00.000Z')])

    expect(ids(result)).toEqual(['a', 'b'])
  })
})
