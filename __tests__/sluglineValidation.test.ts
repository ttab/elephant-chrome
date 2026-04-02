import { isUnique } from '@/components/Form/Root'

describe('isUnique', () => {
  it('returns true when no compareValues provided', () => {
    expect(isUnique('slug-a')).toBe(true)
  })

  it('returns true when compareValues is empty', () => {
    expect(isUnique('slug-a', [])).toBe(true)
  })

  it('returns true when value appears exactly once in compareValues', () => {
    expect(isUnique('slug-c', ['slug-a', 'slug-b', 'slug-c'])).toBe(true)
  })

  it('returns false when value appears more than once in compareValues', () => {
    expect(isUnique('slug-a', ['slug-a', 'slug-b', 'slug-a'])).toBe(false)
  })

  it('returns true for undefined value with no compareValues', () => {
    expect(isUnique(undefined)).toBe(true)
  })
})

describe('slugline uniqueness with planning sluglines', () => {
  const planningSluglines = ['slug-a', 'slug-b']

  it('detects duplicate when current slugline matches a planning slugline', () => {
    const currentSlugline = 'slug-a'
    // The correct compareValues includes both planning sluglines AND the current value
    const compareValues = [...planningSluglines, currentSlugline]

    expect(isUnique(currentSlugline, compareValues)).toBe(false)
  })

  it('allows a unique slugline', () => {
    const currentSlugline = 'slug-c'
    const compareValues = [...planningSluglines, currentSlugline]

    expect(isUnique(currentSlugline, compareValues)).toBe(true)
  })

  it('fails to detect duplicate when compareValues has stale current value (BUG scenario)', () => {
    // This demonstrates the bug: the user changed slugline from 'slug-c' to 'slug-a',
    // but compareValues still has the stale 'slug-c'
    const staleCompareValues = [...planningSluglines, 'slug-c']
    const actualCurrentValue = 'slug-a'

    // With stale data, isUnique incorrectly returns true (the bug)
    expect(isUnique(actualCurrentValue, staleCompareValues)).toBe(true)

    // With correct reactive data, isUnique correctly detects the duplicate
    const reactiveCompareValues = [...planningSluglines, actualCurrentValue]
    expect(isUnique(actualCurrentValue, reactiveCompareValues)).toBe(false)
  })
})
