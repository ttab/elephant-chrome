import { getContentSourceLink } from '@/shared/getContentSourceLink'

describe('getContentSourceLink', () => {
  it('returns TT source when org is core://org/tt', () => {
    const link = getContentSourceLink({ org: 'core://org/tt', units: ['/redaktionen'] })

    expect(link).toBeDefined()
    expect(link?.type).toBe('core/content-source')
    expect(link?.rel).toBe('source')
    expect(link?.uri).toBe('tt://content-source/tt')
    expect(link?.title).toBe('TT')
  })

  it('returns NTB source when org is core://org/ntb', () => {
    const link = getContentSourceLink({ org: 'core://org/ntb', units: ['/redaktionen'] })

    expect(link?.uri).toBe('tt://content-source/ntb')
    expect(link?.title).toBe('NTB')
  })

  it('returns NPK source when units include /redaktionen-npk (overrides org)', () => {
    const link = getContentSourceLink({
      org: 'core://org/ntb',
      units: ['/redaktionen-npk', '/other']
    })

    expect(link?.uri).toBe('tt://content-source/npk')
    expect(link?.title).toBe('NPK')
  })

  it('returns undefined when neither org nor units match', () => {
    expect(getContentSourceLink({})).toBeUndefined()
    expect(getContentSourceLink({ org: 'core://org/unknown' })).toBeUndefined()
    expect(getContentSourceLink({ units: ['/redaktionen'] })).toBeUndefined()
  })
})
