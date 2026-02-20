import { describe, it, expect } from 'vitest'
import { getNestedFacetedUniqueValues } from '@/components/Table/lib/getNestedFacetedUniqueValues'
import type { Column } from '@tanstack/react-table'

function makeColumn(rowData: Array<string[] | undefined>): Column<unknown, unknown> {
  return {
    id: 'testCol',
    getFacetedRowModel: () => ({
      flatRows: rowData.map((values) => ({
        getValue: (_id: string) => values
      }))
    })
  } as unknown as Column<unknown, unknown>
}

describe('getNestedFacetedUniqueValues', () => {
  it('returns empty Map when column is undefined', () => {
    const result = getNestedFacetedUniqueValues(undefined)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('returns empty Map when there are no flat rows', () => {
    const column = makeColumn([])
    const result = getNestedFacetedUniqueValues(column)
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('counts each element of array values', () => {
    const column = makeColumn([['sports', 'politics']])
    const result = getNestedFacetedUniqueValues(column)
    expect(result.get('sports')).toBe(1)
    expect(result.get('politics')).toBe(1)
  })

  it('accumulates occurrences across multiple rows', () => {
    const column = makeColumn([
      ['sports'],
      ['sports', 'politics'],
      ['sports']
    ])
    const result = getNestedFacetedUniqueValues(column)
    expect(result.get('sports')).toBe(3)
    expect(result.get('politics')).toBe(1)
  })

  it('ignores rows where getValue returns undefined', () => {
    const column = makeColumn([undefined, ['sports']])
    const result = getNestedFacetedUniqueValues(column)
    expect(result.get('sports')).toBe(1)
    expect(result.size).toBe(1)
  })

  it('ignores rows where getValue returns empty array', () => {
    const column = makeColumn([[], ['sports']])
    const result = getNestedFacetedUniqueValues(column)
    expect(result.get('sports')).toBe(1)
    expect(result.size).toBe(1)
  })

  it('handles multiple values, some shared across rows', () => {
    const column = makeColumn([
      ['a', 'b', 'c'],
      ['b', 'c'],
      ['c']
    ])
    const result = getNestedFacetedUniqueValues(column)
    expect(result.get('a')).toBe(1)
    expect(result.get('b')).toBe(2)
    expect(result.get('c')).toBe(3)
  })
})
