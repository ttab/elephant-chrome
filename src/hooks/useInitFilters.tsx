import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
import { useQuery, type QueryParams } from '@/hooks/useQuery'
import { useUserTracker } from '@/hooks/useUserTracker'
import { useCallback, useEffect, useMemo, useRef } from 'react'

export const useInitFilters = <TData,>({ path, columns }: {
  path: string
  columns?: ColumnDef<TData>[]
}): ColumnFiltersState => {
  const [query, setQuery] = useQuery()
  const [userFilters] = useUserTracker<QueryParams | undefined>(path)

  // Create a stable set of column IDs for filtering
  const columnIds = useMemo(() =>
    columns ? new Set(columns.map((col) => col.id).filter(Boolean)) : null,
  [columns]
  )

  const isQueryInitialized = useRef(false)

  // Do this _once_
  const shouldInitializeQuery = useCallback((
    userFilters: QueryParams | undefined,
    query: QueryParams
  ): boolean => {
    return !!(
      userFilters
      && hasDefinedFilter(userFilters)
      && !hasDefinedFilter(query)
      && !isQueryInitialized.current
    )
  }, [])

  useEffect(() => {
    if (userFilters && shouldInitializeQuery(userFilters, query)) {
      setQuery(userFilters)
      isQueryInitialized.current = true
    }

    isQueryInitialized.current = true
  }, [userFilters, query, setQuery, shouldInitializeQuery])

  // Determine the active filter source (query takes precedence over user filters)
  const activeFilters = useMemo((): QueryParams | undefined => {
    if (isQueryInitialized.current === true) return undefined
    if (hasDefinedFilter(query)) return query
    if (hasDefinedFilter(userFilters)) return userFilters
    return undefined
  }, [query, userFilters])

  // Convert to ColumnFiltersState format
  const columnFilters = useMemo((): ColumnFiltersState => {
    if (!activeFilters) return []

    return Object.entries(activeFilters)
      .filter(([key, value]) => {
        // Filter out undefined/null/empty values
        if (value === undefined || value === null || value === '') return false
        // Filter by column IDs if columns are provided
        return columnIds ? columnIds.has(key) : true
      })
      .map(([id, value]) => ({
        id,
        value: Array.isArray(value) ? value : [value]
      }))
  }, [activeFilters, columnIds])

  return columnFilters
}

function hasDefinedFilter(filters?: QueryParams): boolean {
  if (!filters) return false

  return Object.values(filters).some((value) =>
    value !== undefined && value !== null && value !== ''
  )
}
