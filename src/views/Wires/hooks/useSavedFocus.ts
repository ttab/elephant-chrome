import { useRef, useCallback } from 'react'

/**
 * Hook to save and restore DOM focus using `data-item-id` attributes.
 *
 * `saveFocus()` captures the `data-item-id` of the currently focused element.
 * `restoreFocus()` immediately reads the saved id (before any async work can
 * overwrite it) and schedules focus restoration via requestAnimationFrame.
 */
export function useSavedFocus() {
  const savedItemIdRef = useRef<string | null>(null)

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement | null
    savedItemIdRef.current = activeElement?.getAttribute('data-item-id') ?? null
  }, [])

  const restoreFocus = useCallback(() => {
    // Capture value now — the ref may be overwritten before the rAF fires
    const itemId = savedItemIdRef.current
    if (itemId) {
      requestAnimationFrame(() => {
        const elementToFocus: HTMLElement | null = document.querySelector(`[data-item-id="${itemId}"]`)
        elementToFocus?.focus()
      })
    }
  }, [])

  return { saveFocus, restoreFocus }
}
