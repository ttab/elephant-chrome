import { serializeText, deserializeText } from '@/shared/transformations/serialization'
import type { TBElement } from '@ttab/textbit'
import type { Descendant } from 'slate'

describe('serializeText', () => {
  it('handles empty/undefined nodes', () => {
    expect(serializeText(undefined)).toEqual({ text: '' })
    expect(serializeText({ children: [] } as unknown as Descendant)).toEqual({ text: '' })
  })

  it('extracts plain text without formatting', () => {
    const node = {
      children: [
        { text: 'Hello world' }
      ]
    }

    const result = serializeText(node as unknown as Descendant)
    expect(result.text).toBe('Hello world')
    expect(result.html_caption).toBeUndefined()
  })

  it('extracts text with bold formatting', () => {
    const node = {
      children: [
        { text: 'Hello ' },
        { text: 'world', 'core/bold': true }
      ]
    }

    const result = serializeText(node as unknown as Descendant)
    expect(result.text).toBe('Hello world')
    expect(result.html_caption).toBe('Hello <strong>world</strong>')
  })

  it('extracts text with italic formatting', () => {
    const node = {
      children: [
        { text: 'Hello ' },
        { text: 'world', 'core/italic': true }
      ]
    }

    const result = serializeText(node as unknown as Descendant)
    expect(result.text).toBe('Hello world')
    expect(result.html_caption).toBe('Hello <em>world</em>')
  })

  it('extracts text with multiple formatting', () => {
    const node = {
      children: [
        { text: 'Plain ' },
        { text: 'bold', 'core/bold': true },
        { text: ' and ' },
        { text: 'italic', 'core/italic': true },
        { text: ' text' }
      ]
    }

    const result = serializeText(node as unknown as Descendant)
    expect(result.text).toBe('Plain bold and italic text')
    expect(result.html_caption).toBe('Plain <strong>bold</strong> and <em>italic</em> text')
  })

  it('escapes HTML entities', () => {
    const node = {
      children: [
        { text: '<script>' },
        { text: 'alert("xss")', 'core/bold': true },
        { text: '</script>' }
      ]
    }

    const result = serializeText(node as unknown as Descendant)
    expect(result.text).toBe('<script>alert("xss")</script>')
    expect(result.html_caption).toBe('&lt;script&gt;<strong>alert(&quot;xss&quot;)</strong>&lt;/script&gt;')
  })
})

describe('deserializeText', () => {
  it('handles null/undefined input', () => {
    const result = deserializeText(null)
    expect(result).toEqual({ children: [{ text: '' }] })
  })

  it('handles plain string input', () => {
    const result = deserializeText('Hello world')
    expect(result).toEqual({ children: [{ text: 'Hello world' }] })
  })

  it('handles object with text only', () => {
    const result = deserializeText({ text: 'Hello world' })
    expect(result).toEqual({ children: [{ text: 'Hello world' }] })
  })

  it('deserializes text with bold formatting', () => {
    const input = {
      text: 'Hello world',
      html_caption: 'Hello <strong>world</strong>'
    }

    const result = deserializeText(input) as TBElement
    expect(Array.isArray(result.children)).toBe(true)
    const children = result.children
    expect(children).toHaveLength(2)
    expect(children[0]).toEqual({ text: 'Hello ' })
    expect(children[1]).toMatchObject({ text: 'world', 'core/bold': true })
  })

  it('deserializes text with italic formatting', () => {
    const input = {
      text: 'Hello world',
      html_caption: 'Hello <em>world</em>'
    }

    const result = deserializeText(input) as TBElement
    expect(Array.isArray(result.children)).toBe(true)
    const children = result.children
    expect(children).toHaveLength(2)
    expect(children[0]).toEqual({ text: 'Hello ' })
    expect(children[1]).toMatchObject({ text: 'world', 'core/italic': true })
  })

  it('deserializes text with multiple formatting', () => {
    const input = {
      text: 'Plain bold and italic text',
      html_caption: 'Plain <strong>bold</strong> and <em>italic</em> text'
    }

    const result = deserializeText(input) as TBElement
    expect(Array.isArray(result.children)).toBe(true)
    const children = result.children
    expect(children).toHaveLength(5)
    expect(children[0]).toEqual({ text: 'Plain ' })
    expect(children[1]).toMatchObject({ text: 'bold', 'core/bold': true })
    expect(children[2]).toEqual({ text: ' and ' })
    expect(children[3]).toMatchObject({ text: 'italic', 'core/italic': true })
    expect(children[4]).toEqual({ text: ' text' })
  })

  it('handles nested formatting', () => {
    const input = {
      text: 'Hello world',
      html_caption: '<strong><em>Hello</em> world</strong>'
    }

    const result = deserializeText(input) as TBElement
    expect(Array.isArray(result.children)).toBe(true)
    const children = result.children
    // Both bold and italic should be applied to "Hello"
    expect(children[0]).toMatchObject({
      text: 'Hello',
      'core/bold': true,
      'core/italic': true
    })
    expect(children[1]).toMatchObject({
      text: ' world',
      'core/bold': true
    })
  })

  it('unescapes HTML entities', () => {
    const input = {
      text: '<script>alert("xss")</script>',
      html_caption: '&lt;script&gt;<strong>alert(&quot;xss&quot;)</strong>&lt;/script&gt;'
    }

    const result = deserializeText(input) as TBElement
    expect(Array.isArray(result.children)).toBe(true)
    const children = result.children
    expect(children[0]).toEqual({ text: '<script>' })
    expect(children[1]).toMatchObject({ text: 'alert("xss")', 'core/bold': true })
    expect(children[2]).toEqual({ text: '</script>' })
  })
})

describe('serializeText and deserializeText round-trip', () => {
  it('preserves plain text through round-trip', () => {
    const original = {
      children: [{ text: 'Hello world' }]
    } as unknown as Descendant

    const serialized = serializeText(original)
    const deserialized = deserializeText(serialized) as TBElement

    expect(deserialized.children).toEqual(original.children)
  })

  it('preserves formatted text through round-trip', () => {
    const original = {
      children: [
        { text: 'Plain ' },
        { text: 'bold', 'core/bold': true },
        { text: ' and ' },
        { text: 'italic', 'core/italic': true }
      ]
    } as unknown as Descendant

    const serialized = serializeText(original)
    const deserialized = deserializeText(serialized) as TBElement

    expect(Array.isArray(deserialized.children)).toBe(true)
    const children = deserialized.children
    expect(children).toHaveLength(4)
    expect(children[0]).toEqual({ text: 'Plain ' })
    expect(children[1]).toMatchObject({ text: 'bold', 'core/bold': true })
    expect(children[2]).toEqual({ text: ' and ' })
    expect(children[3]).toMatchObject({ text: 'italic', 'core/italic': true })
  })

  it('preserves special characters through round-trip', () => {
    const original = {
      children: [
        { text: '< & >' },
        { text: '" \' "', 'core/bold': true }
      ]
    } as unknown as Descendant

    const serialized = serializeText(original)
    const deserialized = deserializeText(serialized) as TBElement

    expect(Array.isArray(deserialized.children)).toBe(true)
    const children = deserialized.children
    expect(children[0]).toEqual({ text: '< & >' })
    expect(children[1]).toMatchObject({ text: '" \' "', 'core/bold': true })
  })
})
