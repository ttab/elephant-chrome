import { useEffect, useState } from 'react'

/**
 * Callback hook that makes it easy to react to document focus changes.
 * If supplied with a callback the callback will be called, if not the hook
 * will return the state as a boolean.
 */
export function useFocus(callback?: (focused: boolean) => void) {
  const [isFocused, setIsFocused] = useState(document.hasFocus())

  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true)
    }
    const handleBlur = () => {
      setIsFocused(false)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useEffect(() => {
    if (callback) {
      callback(isFocused)
    }
  }, [callback, isFocused])
  return isFocused
}
