import { describe, it, expect } from 'vitest'

import {
  extractUserIdFromUri,
  normalizeUserUri,
  generateAuthorUUID
} from '@/shared/userUri'

describe('extractUserIdFromUri', () => {
  it('extracts ID from core://user/{id}', () => {
    expect(extractUserIdFromUri('core://user/5558')).toBe('5558')
  })

  it('extracts ID from core://user/sub/{id}', () => {
    expect(extractUserIdFromUri('core://user/sub/5558')).toBe('5558')
  })

  it('extracts UUID from core://user/{uuid}', () => {
    const uuid = 'cf8eb669-0c0f-432d-8fdf-b479ac2082a1'
    expect(extractUserIdFromUri(`core://user/${uuid}`)).toBe(uuid)
  })

  it('extracts UUID from core://user/sub/{uuid}', () => {
    const uuid = 'cf8eb669-0c0f-432d-8fdf-b479ac2082a1'
    expect(
      extractUserIdFromUri(`core://user/sub/${uuid}`)
    ).toBe(uuid)
  })

  it('returns undefined for empty string', () => {
    expect(extractUserIdFromUri('')).toBeUndefined()
  })

  it('returns undefined for string without slash', () => {
    expect(extractUserIdFromUri('no-slash')).toBeUndefined()
  })

  it('returns undefined for trailing slash', () => {
    expect(extractUserIdFromUri('core://user/')).toBeUndefined()
  })
})

describe('normalizeUserUri', () => {
  it('keeps core://user/{id} as-is', () => {
    expect(normalizeUserUri('core://user/5558')).toBe(
      'core://user/5558'
    )
  })

  it('normalizes core://user/sub/{id} to core://user/{id}', () => {
    expect(normalizeUserUri('core://user/sub/5558')).toBe(
      'core://user/5558'
    )
  })

  it('normalizes core://user/sub/{uuid}', () => {
    const uuid = 'cf8eb669-0c0f-432d-8fdf-b479ac2082a1'
    expect(normalizeUserUri(`core://user/sub/${uuid}`)).toBe(
      `core://user/${uuid}`
    )
  })

  it('returns original string when no ID can be extracted', () => {
    expect(normalizeUserUri('core://user/')).toBe('core://user/')
  })
})

describe('generateAuthorUUID', () => {
  it('returns deterministic UUID for same input', () => {
    const a = generateAuthorUUID('core://user/5558')
    const b = generateAuthorUUID('core://user/5558')
    expect(a).toBe(b)
  })

  it('returns same UUID regardless of URI format', () => {
    const canonical = generateAuthorUUID('core://user/5558')
    const withSub = generateAuthorUUID('core://user/sub/5558')
    expect(canonical).toBe(withSub)
  })

  it('returns different UUIDs for different users', () => {
    const a = generateAuthorUUID('core://user/5558')
    const b = generateAuthorUUID('core://user/9999')
    expect(a).not.toBe(b)
  })

  it('returns a valid UUID v5 format', () => {
    const uuid = generateAuthorUUID('core://user/5558')
    const uuidV5Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(uuid).toMatch(uuidV5Regex)
  })
})
