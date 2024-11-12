import { renderHook, act } from '@testing-library/react'
import { useQuery } from '@/hooks'
import { vi } from 'vitest'

describe('useQuery hook', () => {
  let replaceStateMock: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Mock window.history.replaceState
    replaceStateMock = vi.spyOn(window.history, 'replaceState').mockImplementation((_, __, url) => {
      console.log('typeof url', typeof url)
      if (typeof url === 'string') {
        const search = url.split('?')[1] || ''
        Object.defineProperty(window, 'location', {
          writable: true,
          value: { search: search ? `?${search}` : '' }
        })
      }
    })

    // Mock window.location.search
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { search: '' }
    })
  })

  afterEach(() => {
    replaceStateMock.mockRestore()
  })


  it('should add a query param', () => {
    const { result } = renderHook(() => useQuery())

    act(() => {
      result.current[1]({ foo: 'bar' })
    })

    expect(result.current[0]).toEqual({ foo: 'bar' })
    expect(window.location.search).toBe('?foo=bar')
  })

  it('should remove a query param', () => {
    window.location.search = '?foo=bar'
    const { result } = renderHook(() => useQuery())

    act(() => {
      result.current[1]({ foo: undefined })
    })

    expect(result.current[0]).toEqual({})
    expect(window.location.search).toBe('')
  })

  it('should update a query param value', () => {
    window.location.search = '?foo=bar'
    const { result } = renderHook(() => useQuery())

    act(() => {
      result.current[1]({ foo: 'baz' })
    })

    expect(result.current[0]).toEqual({ foo: 'baz' })
    expect(window.location.search).toBe('?foo=baz')
  })

  it('should reset all query params', () => {
    window.location.search = '?foo=bar&baz=qux'
    const { result } = renderHook(() => useQuery())

    act(() => {
      result.current[1]({})
    })

    expect(result.current[0]).toEqual({})
    expect(window.location.search).toBe('')
  })
})
