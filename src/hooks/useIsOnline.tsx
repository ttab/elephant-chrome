import { useEffect, useState } from 'react'

export const useIsOnline = (): boolean => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOffline = () => {
      setIsOnline(false)
    }
    const onOnline = () => {
      setIsOnline(true)
    }

    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)

    return () => {
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  return isOnline
}
