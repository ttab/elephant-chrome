import { describe, it, expect, beforeEach } from 'vitest'
import { getSystemLanguage, setSystemLanguage } from '@/shared/getSystemLanguage'

describe('getSystemLanguage', () => {
  beforeEach(() => {
    // Reset to known state — setupTests sets 'sv-se' globally,
    // so we re-set it per test for isolation
    setSystemLanguage('')
  })

  it('throws when not initialized', () => {
    expect(() => getSystemLanguage()).toThrow('systemLanguage has not been initialized')
  })

  it('returns the language after setSystemLanguage is called', () => {
    setSystemLanguage('nb-NO')
    expect(getSystemLanguage()).toBe('nb-NO')
  })

  it('overwrites the previous value', () => {
    setSystemLanguage('nb-NO')
    setSystemLanguage('en-GB')
    expect(getSystemLanguage()).toBe('en-GB')
  })
})
