import { useState, useEffect, useCallback } from 'react'
import { useHistory } from '@/navigation/hooks/useHistory'
import { useView } from './useView'

export type QueryParams = Record<string, string | string[] | undefined>
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
export const useQuery = (keys?: string[]): [QueryParams, (params: QueryParams) => void] => {
  const {
    state: historyState,
    replaceState
  } = useHistory()

  const { viewId, isActive } = useView()

  const parseQueryString = useCallback((): Record<string, string | string[] | undefined> => {
    // window.location.search will only return the query parameters of the active view
    // for others non-active use it's contentState.path from historyState
    const historyPath = historyState?.contentState.find((cs) => cs.viewId === viewId)?.path

    const searchParams = new URLSearchParams(isActive || !historyPath
      ? window.location.search
      : historyPath?.replace(window.location.pathname, ''))
    const params: Record<string, string | string[] | undefined> = {}

    for (const [key, value] of searchParams.entries()) {
      if (value.includes(',')) {
        params[key] = value.split(',')
      } else {
        params[key] = value
      }
    }

    if (!keys?.length) {
      return params
    }


    const onlyKeys: { [key: string]: string[] } = {}
    for (const [key, value] of Object.entries(params)) {
      if (keys.includes(key)) {
        onlyKeys[key] = Array.isArray(value)
          ? value.filter((v): v is string => v !== undefined)
          : [value].filter((v): v is string => v !== undefined)
      }
    }
    return onlyKeys
  // We dont need to recreate when keys change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyState, viewId, isActive, keys?.length])

  const [queryParams, setQueryParams] = useState<QueryParams>(parseQueryString)

  // Update queryParams state when historyState changes
  useEffect(() => {
    if (historyState?.viewId === viewId) {
      setQueryParams(parseQueryString())
    }
  }, [historyState, viewId, parseQueryString])

  const setQueryString = useCallback((params: QueryParams): void => {
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
