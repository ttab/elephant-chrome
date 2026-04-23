import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TBElement } from '@ttab/textbit'

const mockTranslate = vi.fn()

vi.mock('@/shared/translate', () => ({
  translate: (...args: unknown[]) => mockTranslate(...args) as unknown
}))

vi.mock('@slate-yjs/core', () => ({
  slateNodesToInsertDelta: (nodes: unknown[]) => nodes.map((n) => ({ insert: n }))
}))

import { translateWireContent, toContentYXmlText } from '@/views/WireCreation/lib/translateWireContent'
import type { TranslateRequest } from '@/shared/translate'
import * as Y from 'yjs'

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

describe('translateWireContent', () => {
  beforeEach(() => {
    mockTranslate.mockReset()
  })

  it('collects texts, translates, and replaces in correct order', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei', 'Verda'] },
      guid: 'test'
    })

    const content: TBElement[] = [
      paragraph('Hello'),
      paragraph('World')
    ]

    const result = await translateWireContent(content, 'standard')

    expect(mockTranslate).toHaveBeenCalledOnce()
    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.texts.values).toEqual(['Hello', 'World'])
    expect(req.source_language).toBe('nb')
    expect(req.target_language).toBe('nn')
    expect(req.prefs_template).toBe('standard')
    expect(req.prefs).toBeUndefined()
    expect(result).toBeDefined()
  })

  it('skips empty and whitespace-only text nodes', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei', 'nøsta tekst'] },
      guid: 'test'
    })

    const content = nestedElements()
    await translateWireContent(content, 'standard')

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.texts.values).toEqual(['Hello', 'nested text'])
  })

  it('skips translation when no text nodes exist', async () => {
    const content: TBElement[] = [{
      type: 'core/image',
      id: '1',
      class: 'block',
      children: [{ text: '' }]
    } as unknown as TBElement]

    const result = await translateWireContent(content, 'standard')

    expect(mockTranslate).not.toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('sends personal prefs when mode is personal', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent([paragraph('Hello')], 'personal', 'e_ending,split_inf')

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      e_ending: { enabled: true },
      split_inf: { enabled: true }
    })
  })

  it('ignores empty keys in personal prefs string', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent([paragraph('Hello')], 'personal', ',key1,,key2,')

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toEqual({
      key1: { enabled: true },
      key2: { enabled: true }
    })
  })

  it('does not send prefs in standard mode even if personalPrefs is provided', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Hei'] },
      guid: 'test'
    })

    await translateWireContent([paragraph('Hello')], 'standard', 'some_pref')

    const req = mockTranslate.mock.calls[0][0] as TranslateRequest
    expect(req.prefs).toBeUndefined()
  })

  it('throws when translation returns wrong number of texts', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['only one'] },
      guid: 'test'
    })

    await expect(
      translateWireContent([paragraph('Hello'), paragraph('World')], 'standard')
    ).rejects.toThrow('Translation returned 1 texts, expected 2')
  })

  it('does not mutate the original content', async () => {
    mockTranslate.mockResolvedValue({
      texts: { values: ['Translated'] },
      guid: 'test'
    })

    const content: TBElement[] = [paragraph('Original')]
    await translateWireContent(content, 'standard')

    expect((content[0] as unknown as { children: Array<{ text: string }> }).children[0].text).toBe('Original')
  })
})

describe('toContentYXmlText', () => {
  it('returns a Y.XmlText instance', () => {
    const result = toContentYXmlText([paragraph('test')])
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(Y.XmlText)
  })
})
