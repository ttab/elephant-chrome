import { describe, it, expect } from 'vitest'
import type * as Y from 'yjs'

import createHash from '@/shared/createHash.js'
import { createTypedYDoc, getValueByYPath, setValueByYPath } from '@/shared/yUtils'
import { toGroupedNewsDoc } from '@/shared/transformations/groupedNewsDoc'
import { planning } from './data/planning-newsdoc'

const createPlanningYMap = (): Y.Map<unknown> => {
  const grouped = toGroupedNewsDoc(planning)
  const yDoc = createTypedYDoc(grouped)
  return yDoc.getMap('ele')
}

const reorderRootProperties = (yMap: Y.Map<unknown>): void => {
  const [rootValue] = getValueByYPath<Record<string, unknown>>(yMap, 'root')
  if (!rootValue) {
    throw new Error('Planning root is missing')
  }

  const entries = Object.entries(rootValue)
  if (entries.length === 0) {
    return
  }

  const rotated = [...entries.slice(1), entries[0]]
  const reorderedRoot = rotated.reduce<Record<string, unknown>>((acc, [key, value]) => {
    acc[key] = value
    return acc
  }, {})

  setValueByYPath(yMap, 'root', reorderedRoot)
}

describe('createHash', () => {
  it('creates identical hashes when order-only changes occur', () => {
    const baseline = createPlanningYMap()
    const reordered = createPlanningYMap()

    reorderRootProperties(reordered)

    expect(createHash(baseline)).toBe(createHash(reordered))
  })

  it('creates different hashes when values differ via setValueByYPath', () => {
    const baseline = createPlanningYMap()
    const mutated = createPlanningYMap()

    setValueByYPath(mutated, 'meta.core/assignment[0].data.start_date', '2024-02-10')

    expect(createHash(baseline)).not.toBe(createHash(mutated))
  })
})
