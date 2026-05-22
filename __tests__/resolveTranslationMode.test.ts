import { describe, it, expect } from 'vitest'
import { resolveTranslationMode } from '@/views/WireCreation/lib/resolveTranslationMode'

describe('resolveTranslationMode', () => {
  it('returns the explicit manual pick when set, regardless of other inputs', () => {
    expect(resolveTranslationMode('none', true, true)).toBe('none')
    expect(resolveTranslationMode('standard', true, true)).toBe('standard')
    expect(resolveTranslationMode('personal', false, false)).toBe('personal')
  })

  it('returns "none" for non-NPK users when no manual pick is set', () => {
    expect(resolveTranslationMode(null, false, false)).toBe('none')
    expect(resolveTranslationMode(null, false, true)).toBe('none')
  })

  it('defaults NPK users with personal prefs to "personal"', () => {
    expect(resolveTranslationMode(null, true, true)).toBe('personal')
  })

  it('defaults NPK users without personal prefs to "standard"', () => {
    expect(resolveTranslationMode(null, true, false)).toBe('standard')
  })

  it('lets a later-arriving hasPersonalPrefs flip the default from standard to personal', () => {
    // Simulates `nynorskPrefs` loading after the first render: manual is still
    // null, hasPersonalPrefs goes false -> true, and the result reflects it.
    expect(resolveTranslationMode(null, true, false)).toBe('standard')
    expect(resolveTranslationMode(null, true, true)).toBe('personal')
  })
})
