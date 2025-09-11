import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
import { useQuery, type QueryParams } from './useQuery'
import { useUserTracker } from './useUserTracker'
import { useEffect, useMemo, useRef } from 'react'

export const useInitFilters = <TData,>({ path, columns }: {
  path: string
  queryKeys?: string[]
  columns?: ColumnDef<TData>[]
}): ColumnFiltersState => {
  const [query, setQuery] = useQuery()
  const [userFilters] = useUserTracker<QueryParams | undefined>(path)

  const didSetQuery = useRef(false)
  useEffect(() => {
    if (userFilters
      && hasDefinedFilter(userFilters)
      && !hasDefinedFilter(query)
      && JSON.stringify(userFilters) !== JSON.stringify(query)
      && !didSetQuery.current
    ) {
      setQuery(userFilters)
      didSetQuery.current = true
    }
  }, [userFilters, query, setQuery])

  const sourceFilters = useMemo(() => {
    if (hasDefinedFilter(query)) return query
    if (hasDefinedFilter(userFilters)) return userFilters
    return undefined
  }, [query, userFilters])

  const filters = useMemo(() => {
    if (!sourceFilters) return []

    const filtered = columns
      ? Object.entries(sourceFilters)
        .filter(([key]) =>
          columns.some((column) => column.id === key))
      : Object.entries(sourceFilters)

    return filtered.map(([key, value]) => ({
      id: key,
      value: Array.isArray(value) ? value : [value]
    }))
  }, [sourceFilters, columns])

  return filters
}

function hasDefinedFilter(obj?: QueryParams): boolean {
  return !!obj && Object
    .values(obj)
    .some((v) =>
      v !== undefined && v !== null && v !== '')
}
