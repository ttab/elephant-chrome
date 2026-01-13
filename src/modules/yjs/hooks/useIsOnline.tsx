import { useSyncExternalStore } from 'react'

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true // for SSR fallback
  )
}

function subscribe(callback: () => void) {
  const onOnline = () => callback()
  const onOffline = () => callback()

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}
