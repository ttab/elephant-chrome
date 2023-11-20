import { useState, useEffect } from 'react'

export const useQuery = (): Record<string, string | undefined> => {
  const [queryParams, setQueryParams] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    const parseQueryString = (): Record<string, string | undefined> => {
      const searchParams = new URLSearchParams(window.location.search)
      const params: Record<string, string | undefined> = {}

      for (const [key, value] of searchParams.entries()) {
        params[key] = value
      }

      return params
    }

    setQueryParams(parseQueryString())

    const handlePopstate = (): void => {
      setQueryParams(parseQueryString())
    }

    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  return queryParams
}
