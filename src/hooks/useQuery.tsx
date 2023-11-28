import { useState, useEffect, useCallback } from 'react'

export const useQuery = (): Record<string, string | undefined> => {
  const parseQueryString = useCallback((): Record<string, string | undefined> => {
    const searchParams = new URLSearchParams(window.location.search)
    const params: Record<string, string | undefined> = {}

    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }

    return params
  }, [])

  const [queryParams, setQueryParams] = useState<Record<string, string | undefined>>(parseQueryString)

  useEffect(() => {
    const handlePopstate = (): void => {
      setQueryParams(parseQueryString())
    }

    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [parseQueryString])

  return queryParams
}
