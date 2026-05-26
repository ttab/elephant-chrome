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


// Cache the snapshot so React only observes history changes from real
// popstate events (native back/forward, or synthetic events dispatched by
// pushState / replaceState). Reading window.history.state on every render
// would otherwise leak silent replaceState mutations (e.g. setActiveView)
// into useSyncExternalStore and trigger extra renders.
//
// The cache is refreshed on subscribe to catch direct window.history.state
// mutations that happen before React mounts the hook - notably
// initializeNavigationState's replaceState during module init.
let cachedSnapshot: HistoryState | null = (window.history.state as HistoryState | null) ?? null

const subscribe = (callback: () => void): (() => void) => {
  cachedSnapshot = (window.history.state as HistoryState | null) ?? null
  const handler = (): void => {
    cachedSnapshot = (window.history.state as HistoryState | null) ?? null
    callback()
  }
  window.addEventListener('popstate', handler)
  return () => window.removeEventListener('popstate', handler)
}

const getSnapshot = (): HistoryState | null => cachedSnapshot

const getServerSnapshot = (): null => null

/**
 * History hook for managing browser history state
 */
export function useHistory(): HistoryInterface {
  // Get the current state using useSyncExternalStore
  const state = useSyncExternalStore<HistoryState | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const pushState = (url: string, newState: HistoryState): void => {
    const state = window.history.state as HistoryState | undefined
    const currentContentState: ContentState[] = state?.contentState || []

    const n = newState.contentState.length - 1
    if (newState.contentState.length === currentContentState.length
      && newState.contentState[n].name === currentContentState[n].name) {
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
    const view = state?.contentState.find((v) => v.viewId === viewId)
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
