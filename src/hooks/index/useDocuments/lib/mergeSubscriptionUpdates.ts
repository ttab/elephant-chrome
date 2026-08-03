import type { HitV1, SortingV1, SubscriptionItem } from '@ttab/elephant-api/index'

/**
 * Merge subscription field updates into the current result set.
 *
 * Matched items patch their fields onto the existing document (optimistic,
 * in-place). The result is then re-sorted by the active `sort` so that a
 * document whose sort field changed - e.g. a new wire version bumping
 * `modified` - moves to its correct position instead of keeping the stale slot
 * the previous version occupied. Status-only updates (read/saved/used heads)
 * don't touch the sort field, so those documents keep their position.
 */
export function mergeSubscriptionUpdates<T extends HitV1>(
  data: T[],
  matchedItems: SubscriptionItem[],
  sort?: SortingV1[]
): T[] {
  const matchedMap = new Map(matchedItems.map((item) => [item.id, item]))

  const merged = data.map((obj) =>
    matchedMap.has(obj.id)
      ? {
          ...obj,
          fields: { ...obj.fields, ...matchedMap.get(obj.id)?.fields }
        }
      : obj
  )

  // Re-sort so a document whose sort field changed (e.g. a new wire version
  // bumping `modified`) moves to its correct position rather than keeping the
  // slot the previous version had. Status-only updates leave the sort field
  // unchanged, so those documents keep their position.
  return sortHits(merged, sort)
}

export function sortHits<T extends HitV1>(hits: T[], sort?: SortingV1[]): T[] {
  if (!sort?.length) {
    return hits
  }

  // Array.prototype.sort is stable, so documents that compare equal keep their
  // relative order.
  return [...hits].sort((a, b) => {
    for (const { field, desc } of sort) {
      const cmp = compareFieldValues(fieldValue(a, field), fieldValue(b, field))
      if (cmp !== 0) {
        return desc ? -cmp : cmp
      }
    }
    return 0
  })
}

function fieldValue(hit: HitV1, field: string): string {
  return hit.fields?.[field]?.values?.[0] ?? ''
}

function compareFieldValues(a: string, b: string): number {
  // Prefer chronological comparison for date-like fields (e.g. `modified`),
  // which is robust to differing timestamp precision; fall back to string order.
  const at = Date.parse(a)
  const bt = Date.parse(b)
  if (!Number.isNaN(at) && !Number.isNaN(bt)) {
    return at === bt ? 0 : at < bt ? -1 : 1
  }
  return a === b ? 0 : a < b ? -1 : 1
}
