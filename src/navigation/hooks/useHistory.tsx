import { useSyncExternalStore } from 'react'
import type { ContentState } from '@/types/index'

export interface HistoryEvent extends Partial<CustomEvent> {
  detail?: {
    viewId: string
    contentState?: ContentState[]
  }
}

export interface HistoryState {
  viewId: string
  contentState: ContentState[]
}

export interface HistoryInterface {
  state: HistoryState | null
  pushState: (url: string, state: HistoryState) => void
  replaceState: (url: string, state: HistoryState, silent?: boolean) => void
  setActiveView: (viewId: string) => void
  back: () => void
  forward: () => void
  go: (delta: number) => void
}


/**
 * History hook for managing browser history state
 */
export function useHistory(): HistoryInterface {
  const subscribe = (callback: () => void): (() => void) => {
    window.addEventListener('popstate', callback)
    return () => window.removeEventListener('popstate', callback)
  }

  const getSnapshot = (): HistoryState | null => {
    return window.history.state as HistoryState | null
  }

  // Get the current state using useSyncExternalStore
  const state = useSyncExternalStore<HistoryState | null>(
    subscribe,
    getSnapshot,
    () => null // Server-side snapshot
  )

  const pushState = (url: string, newState: HistoryState): void => {
    const n = newState.contentState.length - 1
    if (newState.contentState.length === window.history.state.contentState.length &&
      newState.contentState[n].name === window.history.state.contentState[n].name) {
      // As we open the same type of view in the same slot, replace it instead
      replaceState(url, newState)
      return
    }

    window.history.pushState(newState, '', url)
    window.dispatchEvent(new PopStateEvent('popstate', { state: newState }))
  }

  const replaceState = (url: string, newState: HistoryState, dispatchEvent = true): void => {
    window.history.replaceState(newState, '', url)

    if (dispatchEvent) {
      window.dispatchEvent(new PopStateEvent('popstate', { state: newState }))
    }
  }

  const setActiveView = (viewId: string): void => {
    const view = state?.contentState.find(v => v.viewId === viewId)
    if (!view) {
      return
    }

    const newState = {
      viewId,
      contentState: state?.contentState || []
    }

    replaceState(view.path, newState, false)

    window.dispatchEvent(new CustomEvent('activeview', {
      detail: newState
    }))
  }

  const back = (): void => {
    window.history.go(-1)
  }

  const forward = (): void => {
    window.history.go(1)
  }

  const go = (delta: number): void => {
    window.history.go(delta)
  }

  return {
    state,
    pushState,
    replaceState,
    setActiveView,
    back,
    forward,
    go
  }
}
