import { useState, useEffect, useCallback } from 'react'
import { useHistory } from '@/navigation/hooks/useHistory'
import { useView } from './useView'

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
export const useQuery = (): [Record<string, string | string[] | undefined>, (params: Record<string, string | string[] | undefined>) => void] => {
  const {
    state: historyState,
    replaceState
  } = useHistory()

  const { viewId } = useView()

  const parseQueryString = useCallback((): Record<string, string | string[] | undefined> => {
    // Get search from history state instead of window.location.search
    const historyPath = historyState?.contentState.find((cs) => cs.viewId === viewId)?.path

    const searchParams = new URLSearchParams(historyPath?.replace(window.location.pathname, ''))
    const params: Record<string, string | string[] | undefined> = {}

    for (const [key, value] of searchParams.entries()) {
      if (value.includes(',')) {
        params[key] = value.split(',')
      } else {
        params[key] = value
      }
    }

    return params
  }, [historyState, viewId])

  const [queryParams, setQueryParams] = useState<Record<string, string | string[] | undefined>>(parseQueryString)

  // Update queryParams state when historyState changes
  useEffect(() => {
    if (historyState?.viewId === viewId) {
      setQueryParams(parseQueryString())
    }
  }, [historyState, viewId, parseQueryString])


  const setQueryString = useCallback((params: Record<string, string | string[] | undefined>): void => {
    if (!historyState?.contentState || historyState.viewId !== viewId) {
      return
    }

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
          searchParams.set(key, Array.isArray(value)
            ? value.join(',')
            : value)
        } else {
          searchParams.delete(key)
        }
      })
    }

    const newHistoryState = { ...historyState }
    newHistoryState.contentState.forEach((cs) => {
      if (historyState.viewId !== cs.viewId) {
        return
      }

      cs.props = {
        ...cs.props,
        ...Object.fromEntries(searchParams)
      }

      cs.path = `${import.meta.env.BASE_URL || ''}/${cs.name.toLocaleLowerCase()}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    })

    const newUrl = new URL(window.location.href)
    newUrl.search = searchParams.toString()

    replaceState(newUrl.href, newHistoryState)
    setQueryParams(parseQueryString())
  }, [historyState, replaceState, viewId, parseQueryString])

  return [queryParams, setQueryString]
}
