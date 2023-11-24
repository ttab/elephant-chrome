import { useSyncExternalStore } from 'react'
import { type HistoryState } from '@/types'

interface HistoryEvent extends Event {
  state: HistoryState
}

// Patch history to be able to differentiate between pushstate, replacestate and popstate actions
if (typeof history !== 'undefined') {
  for (const type of ['pushstate', 'replacestate', 'popstate']) {
    const original = history[type as keyof typeof history]

    // @ts-expect-error history state and length are readonly
    history[type as keyof typeof history] = function(state: HistoryState, title: string, url?: string | null) {
      const result = original.apply(this, [state, title, url])
      const event = new Event(type.toLowerCase()) as HistoryEvent
      event.state = state
      window.dispatchEvent(event)
      return result
    }
  }
}

let state: HistoryState = history.state

export const useHistory = (): HistoryState | null => {
  function subscribe(callback: () => void): () => void {
    window.addEventListener('pushstate', ((event: HistoryEvent) => {
      event.state.type = 'pushstate'
      state = event.state
      callback()
    }) as EventListener)

    window.addEventListener('replacestate', ((event: HistoryEvent) => {
      event.state.type = 'replacestate'
      state = event.state
      callback()
    }) as EventListener)

    window.addEventListener('popstate', ((event: HistoryEvent) => {
      event.state.type = 'popstate'
      state = event.state
      callback()
    }) as EventListener)

    return () => {
      window.removeEventListener('pushstate', callback)
      window.removeEventListener('replacestate', callback)
      window.removeEventListener('popstate', callback)
    }
  }

  function getSnapshot(): HistoryState | null {
    return state
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}
