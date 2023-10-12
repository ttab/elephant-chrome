import { type RefObject, useMemo, useSyncExternalStore } from 'react'

function subscribe (callback: (e: Event) => void): () => void {
  window.addEventListener('resize', callback)
  return () => {
    window.removeEventListener('resize', callback)
  }
}

function useDimensions (ref: RefObject<HTMLElement>): any {
  const dimensions = useSyncExternalStore(
    subscribe,
    () => JSON.stringify({
      width: ref.current?.offsetWidth ?? 0,
      height: ref.current?.offsetHeight ?? 0
    })
  )
  return useMemo(() => JSON.parse(dimensions), [dimensions])
}

export { useDimensions }
