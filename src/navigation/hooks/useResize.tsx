import { useSyncExternalStore } from 'react'

export const useResize = (): number => {
  function subscribe(callback: () => void): () => void {
    window.addEventListener('resize', callback)
    return () => {
      window.removeEventListener('resize', callback)
    }
  }

  function getSnapshot(): number {
    return window.innerWidth
  }
  return useSyncExternalStore(subscribe, getSnapshot)
}
