import { useEffect, useCallback } from 'react'

export const useAppearEffect = (ref: React.RefObject<HTMLDivElement>): [
  string,
  (cb: () => void) => void
] => {
  useEffect(() => {
    if (!ref.current) {
      return
    }

    setTimeout(() => {
      if (ref.current) {
        ref.current.classList.toggle('opacity-20')
      }
    }, 25)
  }, [ref])

  const revert = useCallback((cb: () => void) => {
    if (ref.current) {
      ref.current.classList.toggle('opacity-20')
    }

    setTimeout(() => {
      cb()
    }, 100)
  }, [ref])

  return ['transition-all ease-in-out duration-200 opacity-20', revert]
}
