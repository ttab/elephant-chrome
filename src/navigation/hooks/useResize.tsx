import { debounce } from '@/lib/debounce'
import { useState, useEffect } from 'react'

export const useResize = (delay: number = 50): {
  width: number
  height: number
} => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handleResize = (): void => setSize({ width: window.innerWidth, height: window.innerHeight })

    const debouncedResize = debounce(handleResize, delay)
    window.addEventListener('resize', debouncedResize)

    return () => {
      window.removeEventListener('resize', debouncedResize)
    }
  }, [delay])

  return size
}
