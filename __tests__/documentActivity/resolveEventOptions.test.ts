import { type MouseEvent as ReactMouseEvent } from 'react'
import { vi } from 'vitest'
import { resolveEventOptions } from '@/lib/documentActivity/useActivity'

describe('resolveEventOptions', () => {
  it('returns null on ctrlKey', () => {
    const event = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as ReactMouseEvent<Element>

    expect(resolveEventOptions(event)).toBeNull()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('returns null on metaKey', () => {
    const event = {
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as ReactMouseEvent<Element>

    expect(resolveEventOptions(event)).toBeNull()
  })

  it('calls preventDefault and stopPropagation on regular click', () => {
    const preventDefault = vi.fn()
    const stopPropagation = vi.fn()
    const event = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault,
      stopPropagation
    } as unknown as ReactMouseEvent<Element>

    resolveEventOptions(event)

    expect(preventDefault).toHaveBeenCalled()
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('returns target "last" when shiftKey is pressed', () => {
    const event = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as ReactMouseEvent<Element>

    const result = resolveEventOptions(event)

    expect(result).toEqual({
      keepFocus: false,
      target: 'last'
    })
  })

  it('returns keepFocus true when Space key is pressed', () => {
    const event = new KeyboardEvent('keydown', { key: ' ' })
    vi.spyOn(event, 'preventDefault')
    vi.spyOn(event, 'stopPropagation')

    const result = resolveEventOptions(event)

    expect(result).toEqual({
      keepFocus: true,
      target: undefined
    })
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.stopPropagation).toHaveBeenCalled()
  })

  it('returns defaults for plain click', () => {
    const event = {
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as ReactMouseEvent<Element>

    const result = resolveEventOptions(event)

    expect(result).toEqual({
      keepFocus: false,
      target: undefined
    })
  })
})
