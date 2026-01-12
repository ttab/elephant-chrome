import { useEffect, useCallback } from 'react'
import { useView } from './useView'

type NavigationKey = 'alt+ArrowLeft' | 'ArrowLeft' | 'alt+ArrowRight' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Enter' | 'Escape' | ' ' | 's' | 'r' | 'c' | 'u'

interface useNavigationKeysOptions {
  onNavigation: (event: KeyboardEvent) => void
  keys: NavigationKey[]
  stopPropagation?: boolean
  preventDefault?: boolean
  enabled?: boolean
  capture?: boolean
  elementRef?: React.RefObject<HTMLElement | HTMLDivElement | null> | null
}

export const useNavigationKeys = (
  {
    onNavigation,
    keys,
    stopPropagation = true,
    preventDefault = true,
    enabled = true,
    capture = false,
    elementRef
  }: useNavigationKeysOptions
): void => {
  const { viewId, isActive } = useView()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (viewId && !isActive) {
      return
    }

    const keyCombination = [
      event.altKey ? 'alt+' : '',
      event.ctrlKey ? 'ctrl+' : '',
      event.shiftKey ? 'shift+' : '',
      event.metaKey ? 'meta+' : '',
      event.key
    ].filter(Boolean).join('')

    const target = event.target as HTMLElement

    // If a ref is provided, only process events within that element
    if (elementRef?.current && !elementRef.current.contains(target)) {
      return
    }

    // Unfocus if active element is an editable element on Escape
    if (event.key === 'Escape' && isEditableElement(document.activeElement)) {
      document.activeElement.blur()
      return
    }

    // Don't override arrow navigation in editable targets
    if (target && isEditableElement(target)) {
      // But allow alt+left and alt+right, for view navigation if _not_ MacOs.
      if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        // On macOS, Option+Arrow is word navigation, so skip handling
        if (isMacOs()) return

        // Browser navigation default will intercept otherwise
        event.preventDefault()
        onNavigation(event)
      }
      return
    }

    // If key is a navigation key
    if (keys.some((key) => keyCombination === key)) {
      if (stopPropagation) {
        event.stopPropagation()
      }

      if (!event.defaultPrevented && preventDefault) {
        event.preventDefault()
      }

      onNavigation(event)
      return
    }

    // When falling through we must hijack up and down to avoid scrolling adjacent
    // views to the active view, if the active view does not catch up and down.
    if (!event.defaultPrevented && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault()
    }
  }, [onNavigation, keys, preventDefault, stopPropagation, isActive, viewId, elementRef])

  useEffect(() => {
    if (!enabled) {
      return
    }

    document.addEventListener('keydown', handleKeyDown, { capture })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture })
  }, [enabled, handleKeyDown, capture])
}

function isEditableElement(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement {
  if (!element) {
    return false
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return true
  }

  if (element.tagName === 'SELECT' || (element.hasAttribute('isContentEditable')) || (element.getAttribute('contentEditable') === 'true')) {
    return true
  }

  return false
}


function isMacOs(): boolean {
  const navigatorModernApi = navigator as Navigator & { userAgentData?: { platform?: string } }
  let platform: string | undefined

  if ('userAgentData' in navigatorModernApi && typeof navigatorModernApi.userAgentData?.platform === 'string') {
    platform = navigatorModernApi.userAgentData.platform
  }

  if (!platform && typeof navigator.platform === 'string') {
    platform = navigator.platform
  }

  if (!platform) {
    platform = navigator.userAgent
  }

  return /\bmac/i.test(platform)
}
