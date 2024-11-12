import { useState, useEffect, useCallback } from 'react'
import { ContentState, HistoryState } from '../types'

/**
 * Custom hook to manage URL query parameters.
 *
 * @returns {Array} A tuple containing:
 *  - queryParams: An object representing the current query parameters.
 *  - setQueryString: A function to update the query parameters.
 *
 * The setQueryString function can be used to add, update, or remove query parameters.
 * - To add or update a parameter, pass an object with the parameter name and value.
 * - To remove a parameter, pass an object with the parameter name and `undefined` as the value.
 * - To reset all parameters, pass an empty object.
 */
export const useQuery = (): [Record<string, string | undefined>, (params: Record<string, string | undefined>) => void] => {
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

  const setQueryString = (params: Record<string, string | undefined>): void => {
    const historyState = history.state as HistoryState
    const searchParams = new URLSearchParams(window.location.search)

    if (Object.keys(params).length === 0) {
      // Collect all keys first
      const keys = Array.from(searchParams.keys())

      // Clear all query parameters
      keys.forEach((key) => {
        searchParams.delete(key)
      })
    } else {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, value)
        } else {
          searchParams.delete(key)
        }
      })
    }


    // Create a new content state with updated props
    const newContentState: ContentState[] = historyState.contentState.map((content: ContentState) => {
      if (historyState.viewId === content.viewId) {
        return {
          ...content,
          props: {
            ...content.props,
            ...Object.fromEntries(searchParams)
          }
        }
      } else {
        return content
      }
    })

    const newState: HistoryState = {
      ...historyState,
      props: {
        ...historyState.props,
        ...Object.fromEntries(searchParams)
      },
      contentState: newContentState
    }

    const newUrl = `${window.location.pathname || '/'}?${searchParams.toString()}`
    window.history.replaceState(newState, '', newUrl)
    setQueryParams(parseQueryString())
  }

  return [queryParams, setQueryString]
}
