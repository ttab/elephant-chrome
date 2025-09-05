import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createLeadingDebounce } from '@/shared/leadingDebounce'

describe('createLeadingDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes immediately on first call', () => {
    const fn = vi.fn()
    const debounce = createLeadingDebounce(fn, 1000, 5000)

    debounce.call('first')
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith('first')
  })

  it('delays subsequent calls within wait time', () => {
    const fn = vi.fn()
    const debounce = createLeadingDebounce(fn, 1000, 5000)

    debounce.call('first')
    debounce.call('second')

    // only first executed immediately
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenLastCalledWith('first')

    // advance just before wait
    vi.advanceTimersByTime(999)
    expect(fn).toHaveBeenCalledTimes(1)

    // advance into wait expiry
    vi.advanceTimersByTime(2)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('second')
  })

  it('always executes with latest arguments', () => {
    const fn = vi.fn()
    const debounce = createLeadingDebounce(fn, 1000, 5000)

    debounce.call('first')
    debounce.call('second')
    debounce.call('third')

    vi.advanceTimersByTime(1001)

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('third')
  })

  it('forces execution after maxWait even with frequent calls', () => {
    const fn = vi.fn()
    const debounce = createLeadingDebounce(fn, 1000, 3000)

    debounce.call('first') // runs immediately

    // Keep spamming every 500ms (below wait)
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(500)
      debounce.call(`spam-${i}`)
    }

    // Before maxWait has passed, only the first call executed
    expect(fn).toHaveBeenCalledTimes(1)

    // Advance to maxWait expiry
    vi.advanceTimersByTime(2500)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('spam-4')
  })

  it('executes immediately again after idle period passes wait', () => {
    const fn = vi.fn()
    const debounce = createLeadingDebounce(fn, 1000, 5000)

    debounce.call('first')
    expect(fn).toHaveBeenCalledTimes(1)

    // Wait past debounce window without new calls
    vi.advanceTimersByTime(2000)

    debounce.call('second')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('second')
  })

  it('flush executes immediately and clears timeouts', () => {
    const fn = vi.fn()
    const debounce = createLeadingDebounce(fn, 1000, 5000)

    debounce.call('first')
    debounce.call('second')

    // flush should run immediately
    debounce.flush('flushed')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith('flushed')

    // advance timers, no further calls
    vi.advanceTimersByTime(2000)
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
