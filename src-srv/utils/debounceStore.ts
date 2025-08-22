type DebounceFunction<T extends (...args: never[]) => void> = (...args: Parameters<T>) => void

interface DebounceWithMaxTimeOptions {
  debounceMs: number
  maxDebounceMs: number
}

interface DebounceState {
  timeoutId: NodeJS.Timeout | null
  maxTimeoutId: NodeJS.Timeout | null
  firstCallTime: number | null
}

export const debounceWithMaxTime = <T extends (...args: never[]) => void>(
  func: T,
  options: DebounceWithMaxTimeOptions
): DebounceFunction<T> => {
  const state: DebounceState = {
    timeoutId: null,
    maxTimeoutId: null,
    firstCallTime: null
  }

  const execute = (...args: Parameters<T>) => {
    // Clear any existing timeouts
    if (state.timeoutId) clearTimeout(state.timeoutId)
    if (state.maxTimeoutId) clearTimeout(state.maxTimeoutId)

    // Reset state
    state.timeoutId = null
    state.maxTimeoutId = null
    state.firstCallTime = null

    // Execute the function
    func(...args)
  }

  return (...args: Parameters<T>) => {
    const now = Date.now()

    // Clear existing debounce timeout
    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
    }

    // Set first call time if this is the first call in the sequence
    if (state.firstCallTime === null) {
      state.firstCallTime = now

      // Set max timeout - this will execute regardless of debouncing
      state.maxTimeoutId = setTimeout(() => {
        execute(...args)
      }, options.maxDebounceMs)
    }

    // Calculate remaining time until max timeout
    const timeElapsed = now - state.firstCallTime
    const remainingMaxTime = options.maxDebounceMs - timeElapsed

    // If we would exceed max time with normal debounce, execute immediately
    if (remainingMaxTime <= options.debounceMs) {
      execute(...args)
      return
    }

    // Set normal debounce timeout
    state.timeoutId = setTimeout(() => {
      execute(...args)
    }, options.debounceMs)
  }
}

interface FlushableDebouncer<T extends (...args: never[]) => void> {
  debouncer: DebounceFunction<T>
  flush: (...args: Parameters<T>) => void
}

const createFlushableDebouncer = <T extends (...args: never[]) => void>(
  func: T,
  options: DebounceWithMaxTimeOptions
): FlushableDebouncer<T> => {
  const state: DebounceState = {
    timeoutId: null,
    maxTimeoutId: null,
    firstCallTime: null
  }

  const execute = (...args: Parameters<T>) => {
    // Clear any existing timeouts
    if (state.timeoutId) clearTimeout(state.timeoutId)
    if (state.maxTimeoutId) clearTimeout(state.maxTimeoutId)

    // Reset state
    state.timeoutId = null
    state.maxTimeoutId = null
    state.firstCallTime = null

    // Execute the function
    func(...args)
  }

  const debouncer = (...args: Parameters<T>) => {
    const now = Date.now()

    // Clear existing debounce timeout
    if (state.timeoutId) {
      clearTimeout(state.timeoutId)
    }

    // Set first call time if this is the first call in the sequence
    if (state.firstCallTime === null) {
      state.firstCallTime = now

      // Set max timeout - this will execute regardless of debouncing
      state.maxTimeoutId = setTimeout(() => {
        execute(...args)
      }, options.maxDebounceMs)
    }

    // Calculate remaining time until max timeout
    const timeElapsed = now - state.firstCallTime
    const remainingMaxTime = options.maxDebounceMs - timeElapsed

    // If we would exceed max time with normal debounce, execute immediately
    if (remainingMaxTime <= options.debounceMs) {
      execute(...args)
      return
    }

    // Set normal debounce timeout
    state.timeoutId = setTimeout(() => {
      execute(...args)
    }, options.debounceMs)
  }

  const flush = (...args: Parameters<T>) => {
    // If there's a pending operation, execute it immediately
    if (state.timeoutId || state.maxTimeoutId) {
      execute(...args)
    }
  }

  return { debouncer, flush }
}

interface MultiDebounceWithFlush<T extends (...args: never[]) => void> {
  call: (key: string, ...args: Parameters<T>) => void
  flush: (key: string, ...args: Parameters<T>) => void
}

export const createMultiDebounceWithMaxTime = <T extends (...args: never[]) => void>(
  func: T,
  options: DebounceWithMaxTimeOptions
): MultiDebounceWithFlush<T> => {
  const debouncers = new Map<string, FlushableDebouncer<T>>()

  const call = (key: string, ...args: Parameters<T>) => {
    let entry = debouncers.get(key)

    if (!entry) {
      entry = createFlushableDebouncer(func, options)
      debouncers.set(key, entry)
    }

    entry.debouncer(...args)
  }

  const flush = (key: string, ...args: Parameters<T>) => {
    const entry = debouncers.get(key)
    if (entry) {
      entry.flush(...args)
      // Clean up after flush
      debouncers.delete(key)
    }
  }

  return { call, flush }
}
