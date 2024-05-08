import { useEffect } from 'react'

/**
 * Detect global keydowns specific to a component. Returns ref which should be
 * attached to an element which wants to detect keydown events.
 */
export function useKeydownGlobal(cb: (e: KeyboardEvent) => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      cb(e)
    }

    document.addEventListener('keydown', handler)

    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [cb])
}
