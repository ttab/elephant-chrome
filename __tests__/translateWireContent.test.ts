import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TBElement } from '@ttab/textbit'

const mockTranslate = vi.fn()

vi.mock('@/shared/translate', () => ({
  translate: (...args: unknown[]) => mockTranslate(...args) as unknown
}))

import { translateWireContent } from '@/views/WireCreation/lib/translateWireContent'
import type { TranslateRequest } from '@/shared/translate'

function paragraph(text: string): TBElement {
  return {
    type: 'core/text',
    id: '1',
    class: 'text',
    children: [{ text }]
  } as unknown as TBElement
}

function nestedElements(): TBElement[] {
  return [
    {
      type: 'core/text',
      id: '1',
      class: 'text',
      children: [
        { text: 'Hello' },
        {
          type: 'core/text',
          id: '2',
          children: [
            { text: 'nested text' },
            { text: '' },
            { text: '  ' }
          ]
        }
      ]
    }
  ] as unknown as TBElement[]
}

function textsIn(elements: TBElement[]): string[] {
  const texts: string[] = []
  function walk(node: unknown): void {
    if (typeof node === 'object' && node !== null) {
      if ('text' in node && typeof (node as { text: unknown }).text === 'string') {
        texts.push((node as { text: string }).text)
      }
      if ('children' in node) {
        const children = (node as { children: unknown[] }).children
        if (Array.isArray(children)) children.forEach(walk)
      }
    }
  }
  elements.forEach(walk)
  return texts
}

const translateOpts = { ntbUrl: 'https://ntb.example/', accessToken: 'tok' }

describe('translateWireContent', () => {
  beforeEach(() => {
    mockTranslate.mockReset()
  })

  it('forwards ntbUrl and accessToken to the underlying translate call', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent([paragraph('Hello')], 'standard', translateOpts)

    expect(mockTranslate).toHaveBeenCalledOnce()
    const opts = mockTranslate.mock.calls[0][1] as { ntbUrl: string, accessToken: string }
    expect(opts.ntbUrl).toBe('https://ntb.example/')
    expect(opts.accessToken).toBe('tok')
  })

  it('collects texts, translates, and returns translated TBElement tree', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei', 'Verda'] },
      guid: 'test'
    })

    const content: TBElement[] = [
      paragraph('Hello'),
      paragraph('World')
    ]

    const result = await translateWireContent(content, 'standard', translateOpts)

    expect(mockTranslate).toHaveBeenCalledOnce()
    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.texts.values).toEqual(['Hello', 'World'])
    expect(req.source_language).toBe('nb')
    expect(req.target_language).toBe('nn')
    expect(req.prefs_template).toBe('standard')
    expect(req.prefs).toBeUndefined()
    expect(textsIn(result)).toEqual(['Hei', 'Verda'])
  })

  it('skips empty and whitespace-only text nodes when collecting', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei', 'nøsta tekst'] },
      guid: 'test'
    })

    const content = nestedElements()
    const result = await translateWireContent(content, 'standard', translateOpts)

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.texts.values).toEqual(['Hello', 'nested text'])

    // The empty/whitespace texts are preserved in the result, only non-empty
    // ones are replaced.
    expect(textsIn(result)).toEqual(['Hei', 'nøsta tekst', '', '  '])
  })

  it('skips translation when no text nodes exist', async () => {
    const content: TBElement[] = [{
      type: 'core/image',
      id: '1',
      class: 'block',
      children: [{ text: '' }]
    } as unknown as TBElement]

    const result = await translateWireContent(content, 'standard', translateOpts)

    expect(mockTranslate).not.toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('sends personal prefs when mode is personal', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent([paragraph('Hello')], 'personal', { ...translateOpts, personalPrefs: 'e_ending,split_inf' })

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      e_ending: { enabled: true },
      split_inf: { enabled: true }
    })
    // Must not also send `prefs_template`, or the named template overrides
    // the explicit prefs server-side.
    expect(req.prefs_template).toBeUndefined()
  })

  it('falls back to the standard template when mode is personal but no personalPrefs are set', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent([paragraph('Hello')], 'personal', translateOpts)

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toBeUndefined()
    expect(req.prefs_template).toBe('standard')
  })

  it('ignores empty and whitespace-only keys in personal prefs string', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent(
      [paragraph('Hello')],
      'personal',
      { ...translateOpts, personalPrefs: ',key1, , key2,' }
    )

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      key1: { enabled: true },
      key2: { enabled: true }
    })
  })

  it('parses key=word as a single-value words entry', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent(
      [paragraph('Hello')],
      'personal',
      { ...translateOpts, personalPrefs: 'håpa_håpte.vb-e2a=trene' }
    )

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      'håpa_håpte.vb-e2a': { words: { values: ['trene'] } }
    })
  })

  it('parses key=w1:w2:w3 as a multi-value words entry', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent(
      [paragraph('Hello')],
      'personal',
      { ...translateOpts, personalPrefs: 'lova_loven.n-f2m=grad:kasse:klage:prøve' }
    )

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      'lova_loven.n-f2m': { words: { values: ['grad', 'kasse', 'klage', 'prøve'] } }
    })
  })

  it('handles a mix of bare keys and key=word entries', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    const input = [
      'bodskapen_bodskapet.n-m2nt',
      'banen_bana.n-m2f=bane:klasse:plante',
      'tek_tar.vb-en2tt',
      'håpa_håpte.vb-e2a=trene'
    ].join(',')

    await translateWireContent(
      [paragraph('Hello')],
      'personal',
      { ...translateOpts, personalPrefs: input }
    )

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      'bodskapen_bodskapet.n-m2nt': { enabled: true },
      'banen_bana.n-m2f': { words: { values: ['bane', 'klasse', 'plante'] } },
      'tek_tar.vb-en2tt': { enabled: true },
      'håpa_håpte.vb-e2a': { words: { values: ['trene'] } }
    })
  })

  // Regression: the exact rule_string from the original bug report.
  it('matches the expected NTB prefs shape for the original bug-report string', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    const input = 'sitat.lastå,me_vi,verken_korkje.syn,dess-der_di.afx,'
      + 'enkje_enke.kons-kj2k_gj2g,linje_line.stav,lova_loven.n-f2m=klage,'
      + 'brukte_bruka.vb-e2a=tale,håpa_håpte.vb-e2a=peike,førebu_seg_bu_seg,'
      + 'forskjell_skilnad.syn,fornøgd_nøgd.syn,bekrefter_bekrifter'

    await translateWireContent(
      [paragraph('Hello')],
      'personal',
      { ...translateOpts, personalPrefs: input }
    )

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      'sitat.lastå': { enabled: true },
      me_vi: { enabled: true },
      'verken_korkje.syn': { enabled: true },
      'dess-der_di.afx': { enabled: true },
      'enkje_enke.kons-kj2k_gj2g': { enabled: true },
      'linje_line.stav': { enabled: true },
      'lova_loven.n-f2m': { words: { values: ['klage'] } },
      'brukte_bruka.vb-e2a': { words: { values: ['tale'] } },
      'håpa_håpte.vb-e2a': { words: { values: ['peike'] } },
      førebu_seg_bu_seg: { enabled: true },
      'forskjell_skilnad.syn': { enabled: true },
      'fornøgd_nøgd.syn': { enabled: true },
      bekrefter_bekrifter: { enabled: true }
    })
  })

  // Regression: the exact multi-value rule_string from the original bug report.
  it('matches the expected NTB prefs shape for the multi-value rule_string', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    const input = 'banen_bana.n-m2f=bane:klasse:plante:takk:tale:tekst:bygning:leidning,'
      + 'bodskapen_bodskapet.n-m2nt,lova_loven.n-f2m=grad:kasse:klage:prøve,'
      + 'tek_tar.vb-en2tt,dreg_drar.vb-en2tt,'
      + 'brukte_bruka.vb-e2a=betale:bruke:dreie:heise:klare:leie:skape:skjønne:'
      + 'spare:spele:svare:tale:tvile,er_ar.vb-e2a,håpa_håpte.vb-e2a=trene'

    await translateWireContent(
      [paragraph('Hello')],
      'personal',
      { ...translateOpts, personalPrefs: input }
    )

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      'banen_bana.n-m2f': {
        words: { values: ['bane', 'klasse', 'plante', 'takk', 'tale', 'tekst', 'bygning', 'leidning'] }
      },
      'bodskapen_bodskapet.n-m2nt': { enabled: true },
      'lova_loven.n-f2m': { words: { values: ['grad', 'kasse', 'klage', 'prøve'] } },
      'tek_tar.vb-en2tt': { enabled: true },
      'dreg_drar.vb-en2tt': { enabled: true },
      'brukte_bruka.vb-e2a': {
        words: {
          values: ['betale', 'bruke', 'dreie', 'heise', 'klare', 'leie', 'skape',
            'skjønne', 'spare', 'spele', 'svare', 'tale', 'tvile']
        }
      },
      'er_ar.vb-e2a': { enabled: true },
      'håpa_håpte.vb-e2a': { words: { values: ['trene'] } }
    })
  })

  it('skips empty values inside key=v1::v2', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent(
      [paragraph('Hello')],
      'personal',
      { ...translateOpts, personalPrefs: 'foo=a::b: :c' }
    )

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      foo: { words: { values: ['a', 'b', 'c'] } }
    })
  })

  it('does not send prefs in standard mode even if personalPrefs is provided', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent([paragraph('Hello')], 'standard', { ...translateOpts, personalPrefs: 'some_pref' })

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toBeUndefined()
  })

  it('throws when translation returns wrong number of texts', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['only one'] },
      guid: 'test'
    })

    await expect(
      translateWireContent([paragraph('Hello'), paragraph('World')], 'standard', translateOpts)
    ).rejects.toThrow('Translation returned 1 texts, expected 2')
  })

  it('does not mutate the original content', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Translated'] },
      guid: 'test'
    })

    const content: TBElement[] = [paragraph('Original')]
    await translateWireContent(content, 'standard', translateOpts)

    expect((content[0] as unknown as { children: Array<{ text: string }> }).children[0].text).toBe('Original')
  })
})
