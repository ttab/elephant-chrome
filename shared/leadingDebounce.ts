/*
 * Leading debounce
 *
 * - First call, or new calls after wait period, executes immediately.
 * - Wait time makes subsequent calls delayed (throttled).
 * - Max wait prevents indefinite delays in high frequency scenarios.
 */

type Fn<T> = (arg: T) => void

export function createLeadingDebounce<T>(fn: Fn<T>, wait: number, maxWait: number) {
  let timeout: NodeJS.Timeout | undefined
  let maxTimeout: NodeJS.Timeout | undefined
  let lastInvoke = 0
  let latestArg: T | undefined

  function invoke(arg: T) {
    fn(arg)
    lastInvoke = Date.now()
    latestArg = undefined
    clear()
  }

  function call(arg: T) {
    const now = Date.now()
    latestArg = arg
    const timeSinceLast = now - lastInvoke

    // First call or idle (no active timeouts) and enough time passed
    if (lastInvoke === 0 || (timeSinceLast >= wait && !timeout && !maxTimeout)) {
      invoke(arg)
      return
    }

    // Reset the normal wait timer: fires only if calls stop for `wait` ms
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      if (latestArg !== undefined) invoke(latestArg)
    }, wait)

    // Ensure maxWait guard (relative to *first* throttled call)
    if (!maxTimeout) {
      const remainingMax = maxWait - timeSinceLast
      maxTimeout = setTimeout(() => {
        if (latestArg !== undefined) invoke(latestArg)
      }, remainingMax)
    }
  }

  function flush(arg: T) {
    invoke(arg)
  }

  function clear() {
    if (timeout) clearTimeout(timeout)
    if (maxTimeout) clearTimeout(maxTimeout)
    timeout = undefined
    maxTimeout = undefined
  }

  return { call, flush }
}


type KeyedFn<T> = (key: string, arg: T) => void
export function createDebounceMap<T>(
  fn: KeyedFn<T>,
  wait: number,
  maxWait: number
) {
  const debouncers = new Map<string, ReturnType<typeof createLeadingDebounce<T>>>()

  function call(key: string, arg: T) {
    let debouncer = debouncers.get(key)

    if (!debouncer) {
      debouncer = createLeadingDebounce<T>(
        (payload) => fn(key, payload),
        wait,
        maxWait
      )
      debouncers.set(key, debouncer)
    }

    debouncer.call(arg)
  }

  function flush(key: string, arg: T) {
    const debouncer = debouncers.get(key)
    if (debouncer) {
      debouncer.flush(arg)
    } else {
      // No existing debouncer, just execute
      fn(key, arg)
    }
  }

  function clear(key: string) {
    debouncers.delete(key)
  }

  function clearAll() {
    debouncers.clear()
  }

  return { call, flush, clear, clearAll }
}
