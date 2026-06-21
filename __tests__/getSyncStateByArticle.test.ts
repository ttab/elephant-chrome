import { describe, it, expect } from 'vitest'
import type { HitV1 } from '@ttab/elephant-api/index'
import { getSyncStateByArticle } from '@/views/Factbox/lib/getSyncStateByArticle'

const makeHit = (id: string | undefined, versions: string[] | undefined): HitV1 => ({
  id,
  fields: versions === undefined
    ? {}
    : { 'document.content.core_factbox.data.original_version': { values: versions } }
} as unknown as HitV1)

describe('getSyncStateByArticle', () => {
  it('returns an empty map when articles is undefined', () => {
    expect(getSyncStateByArticle(undefined, 'v1')).toEqual(new Map())
  })

  it('returns an empty map when articles is an empty array', () => {
    expect(getSyncStateByArticle([], 'v1')).toEqual(new Map())
  })

  it('returns an empty map when currentVersion is undefined', () => {
    const hits = [makeHit('a', ['v1'])]
    expect(getSyncStateByArticle(hits, undefined)).toEqual(new Map())
  })

  it('marks articles whose versions include currentVersion as inSync', () => {
    const hits = [makeHit('a', ['v1', 'v2'])]
    const result = getSyncStateByArticle(hits, 'v2')
    expect(result.get('a')).toBe('inSync')
  })

  it('marks articles whose versions do not include currentVersion as outOfSync', () => {
    const hits = [makeHit('a', ['v1', 'v2'])]
    const result = getSyncStateByArticle(hits, 'v3')
    expect(result.get('a')).toBe('outOfSync')
  })

  it('marks articles with no version field as unknown', () => {
    const hits = [makeHit('a', undefined)]
    expect(getSyncStateByArticle(hits, 'v1').get('a')).toBe('unknown')
  })

  it('marks articles with an empty versions array as unknown', () => {
    const hits = [makeHit('a', [])]
    expect(getSyncStateByArticle(hits, 'v1').get('a')).toBe('unknown')
  })

  it('skips articles without an id', () => {
    const hits = [makeHit(undefined, ['v1']), makeHit('b', ['v1'])]
    const result = getSyncStateByArticle(hits, 'v1')
    expect(result.size).toBe(1)
    expect(result.get('b')).toBe('inSync')
  })

  it('handles a mix of inSync, outOfSync, and unknown', () => {
    const hits = [
      makeHit('in', ['v1']),
      makeHit('out', ['v2']),
      makeHit('unknown-empty', []),
      makeHit('unknown-missing', undefined)
    ]
    const result = getSyncStateByArticle(hits, 'v1')
    expect(result.get('in')).toBe('inSync')
    expect(result.get('out')).toBe('outOfSync')
    expect(result.get('unknown-empty')).toBe('unknown')
    expect(result.get('unknown-missing')).toBe('unknown')
  })
})
