import { getLanguageLabel } from '@/lib/getLanguageLabel'

describe('getLanguageLabel', () => {
  it('returns the autonym for plain language codes', () => {
    expect(getLanguageLabel('sv')).toBe('Svenska')
    expect(getLanguageLabel('en')).toBe('English')
    expect(getLanguageLabel('pl')).toBe('Polski')
  })

  it('uses the bare-form override for Norwegian variants', () => {
    expect(getLanguageLabel('nb')).toBe('Bokmål')
    expect(getLanguageLabel('nn')).toBe('Nynorsk')
  })

  it('strips the region — sv-se and sv-fi both render as Svenska', () => {
    expect(getLanguageLabel('sv-se')).toBe('Svenska')
    expect(getLanguageLabel('sv-fi')).toBe('Svenska')
    expect(getLanguageLabel('nb-no')).toBe('Bokmål')
    expect(getLanguageLabel('nn-no')).toBe('Nynorsk')
  })

  it('is case-insensitive on the input', () => {
    expect(getLanguageLabel('SV-SE')).toBe('Svenska')
    expect(getLanguageLabel('Nn-NO')).toBe('Nynorsk')
  })

  it('falls back to the raw code when Intl cannot resolve it', () => {
    // Made-up subtag that DisplayNames returns as-is.
    expect(getLanguageLabel('xx-yy')).toBe('xx-yy')
  })

  it('returns empty string for empty input', () => {
    expect(getLanguageLabel('')).toBe('')
    expect(getLanguageLabel(undefined)).toBe('')
  })
})
