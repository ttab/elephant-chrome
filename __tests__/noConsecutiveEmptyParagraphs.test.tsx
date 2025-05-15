import { removeConsecutiveEmptyTextNodes } from '@/shared/transformations/yjsNewsDoc'
import { TextbitElement } from '@ttab/textbit'
import type { TBElement } from '@ttab/textbit'
import { type Descendant, Text } from 'slate'

const createTextNode = (text: string, role?: string): TBElement => ({
  id: crypto.randomUUID(),
  type: 'core/text',
  class: 'text',
  properties: role ? { role } : {},
  children: [{ text }]
})

describe('removeConsecutiveEmptyTextNodes', () => {
  it('removes only consecutive untyped empty paragraphs', () => {
    const input: Descendant[] = [
      createTextNode('Heading', 'heading-1'),
      createTextNode(''),
      createTextNode('Body', 'preamble'),
      createTextNode(''),
      createTextNode(''),
      createTextNode('More body'),
      createTextNode(''),
      createTextNode(''),
      createTextNode('')
    ]

    const output = removeConsecutiveEmptyTextNodes(input)

    const texts = output.map((el) =>
      TextbitElement.isText(el)
        ? el.children.map((c) => Text.isText(c) ? c.text : '').join('')
        : '[non-text]'
    )

    expect(texts).toEqual([
      'Heading',
      '',
      'Body',
      '',
      'More body',
      ''
    ])
  })

  it('keeps all empty paragraphs with role', () => {
    const input: TBElement[] = [
      createTextNode('', 'vignette'),
      createTextNode('', 'vignette'),
      createTextNode('', 'vignette')
    ]

    const output = removeConsecutiveEmptyTextNodes(input)
    expect(output).toHaveLength(3)
  })

  it('keeps non-empty untyped text nodes', () => {
    const input: TBElement[] = [
      createTextNode(''),
      createTextNode('Not empty'),
      createTextNode('')
    ]

    const output = removeConsecutiveEmptyTextNodes(input)

    const texts = output.map((el) =>
      TextbitElement.isText(el)
        ? el.children.map((c) => Text.isText(c) ? c.text : '').join('')
        : '[non-text]'
    )

    expect(texts).toEqual([
      '',
      'Not empty',
      ''
    ])
  })
})
