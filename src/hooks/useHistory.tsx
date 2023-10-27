import { useSyncExternalStore } from 'react'
import { type HistoryState } from '@/types'

export const useHistory = (): HistoryState => {
  function subscribe(callback: () => void): () => void {
    window.addEventListener('popstate', callback)
    return () => {
      window.removeEventListener('popstate', callback)
    }
  }

  function getSnapshot(): HistoryState {
    return history.state
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}
