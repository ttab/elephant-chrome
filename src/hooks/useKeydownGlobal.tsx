import { useEffect } from 'react'

/**
 * Detect global keydowns.
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
