import { useEffect, useCallback } from 'react'
import { useView } from './useView'

type NavigationKey = 'ArrowLeft' | 'ArrowUp' | 'ArrowRight' | 'ArrowDown' | 'Enter' | 'Escape' | 'Space'
interface useNavigationKeysOptions {
  onNavigation: (event: KeyboardEvent) => void
  keys: NavigationKey[]
  stopPropagation?: boolean
  preventDefault?: boolean
  enabled?: boolean
}

export const useNavigationKeys = (
  { onNavigation, keys, stopPropagation = false, preventDefault = false, enabled = true }: useNavigationKeysOptions
): void => {
  const { viewId, isActive } = useView()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (viewId && !isActive) {
      return
    }

    // Unfocus if active element is an editable element on Escape
    if (event.key === 'Escape' && isEditableElement(document.activeElement)) {
      document.activeElement.blur()
      return
    }

    // Don't override arrow navigation in editable targets
    if (event.target && isEditableElement(event.target as HTMLElement)) {
      return
    }

    // If default was prevented already, don't act on it
    if (event.defaultPrevented) {
      return
    }

    // If key is a navigation key
    if (keys.some((key) => event.key === key)) {
      if (preventDefault) {
        event.preventDefault()
      }

      if (stopPropagation) {
        event.stopPropagation()
      }

      onNavigation(event)
    }
  }, [onNavigation, keys, preventDefault, stopPropagation, isActive, viewId])

  useEffect(() => {
    if (!enabled) {
      return
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}

export function isEditableElement(element: Element | null): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement {
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
