import { describe, it, expect, afterEach } from 'vitest'
import { setSystemLanguage } from '@/shared/getSystemLanguage'
import { resolveFallbackLanguage } from '@/lib/i18n'
import i18n from '@/lib/i18n'

describe('resolveFallbackLanguage', () => {
  afterEach(() => {
    setSystemLanguage('sv-se')
  })

  it('maps nn to nb', () => {
    expect(resolveFallbackLanguage('nn')).toBe('nb')
  })

  it('maps nb to nb', () => {
    expect(resolveFallbackLanguage('nb')).toBe('nb')
  })

  it('maps no to nb', () => {
    expect(resolveFallbackLanguage('no')).toBe('nb')
  })

  it('maps nb-NO to nb', () => {
    expect(resolveFallbackLanguage('nb-NO')).toBe('nb')
  })

  it('maps nn-NO to nb', () => {
    expect(resolveFallbackLanguage('nn-NO')).toBe('nb')
  })

  it('returns system language code when it is a supported UI language', () => {
    setSystemLanguage('sv-se')
    expect(resolveFallbackLanguage('fr')).toBe('sv')
  })

  it('returns system language code for nb system language', () => {
    setSystemLanguage('nb-NO')
    expect(resolveFallbackLanguage('fr')).toBe('nb')
  })

  it('returns en when system language is not a supported UI language', () => {
    setSystemLanguage('de-DE')
    expect(resolveFallbackLanguage('fr')).toBe('en')
  })

  it('returns en when getSystemLanguage is not initialized', () => {
    setSystemLanguage('')
    expect(resolveFallbackLanguage('fr')).toBe('en')
  })
})

describe('custom formatters', () => {
  it('lowercase formatter converts to lower case', () => {
    const result = i18n.services.formatter?.format('HELLO WORLD', 'lowercase', 'sv', {})
    expect(result).toBe('hello world')
  })

  it('capitalize formatter capitalizes first letter', () => {
    const result = i18n.services.formatter?.format('hello world', 'capitalize', 'sv', {})
    expect(result).toBe('Hello world')
  })

  it('capitalize handles empty string', () => {
    const result = i18n.services.formatter?.format('', 'capitalize', 'sv', {})
    expect(result).toBe('')
  })
})
