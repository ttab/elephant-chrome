import type { QueryParams } from '@/hooks/useQuery'
import type { ColumnDef, ColumnFiltersState, Updater } from '@tanstack/react-table'

/**
 * Loads filters for columns based on query parameters and saved filters.
 *
 * @template T - The type of the column data.
 * @param query - The query parameters from the URL or other sources.
 * @param columns - The definitions of the columns to filter.
 * @returns The state of the column filters.
 */
export function loadFilters<TData>({
  query,
  userFilters,
  setQuery,
  columns
}: {
  query?: QueryParams
  userFilters?: QueryParams
  setQuery?: (params: QueryParams) => void
  columns: ColumnDef<TData>[]
}): ColumnFiltersState {
  // Prefer query, fallback to userFilters if setQuery is provided
  const source = hasDefinedFilter(query)
    ? query
    : hasDefinedFilter(userFilters) && setQuery
      ? userFilters
      : undefined

  if (source) {
    if (source === userFilters && setQuery) setQuery(userFilters)
    return Object.entries(source)
      .filter(([key]) => columns
        .some((column) => column.id === key))
      .map(([key, value]) => ({
        id: key,
        value: Array.isArray(value) ? value : [value]
      }))
  }

  return []
}

/**
 * Updates and converts columnFilters to a QueryParams.
 * Sets removed values to undefined
 *
 * @param updater - A function or array to update the columnFilters state.
 * @param previous - The previous state of the columnFilters.
 * @returns An object where keys are column IDs and values are arrays of filter values or undefined.
 */
export function updateFilter(updater: Updater<ColumnFiltersState>, previous: ColumnFiltersState | undefined): QueryParams {
  const updatedFilters = typeof updater === 'function' ? updater(previous || []) : updater
  const result: QueryParams = {}

  if (previous) {
    for (const filter of previous) {
      result[filter.id] = undefined
    }
  }

  for (const filter of updatedFilters) {
    result[filter.id] = filter.value as string[] | undefined
  }

  return result
}

export function columnFilterToQuery(columnFilters: ColumnFiltersState): QueryParams {
  const query: QueryParams = {}

  for (const filter of columnFilters) {
    query[filter.id] = filter.value as string[] | undefined
  }

  return query
}


export function hasDefinedFilter(obj?: QueryParams): boolean {
  return !!obj && Object
    .values(obj)
    .some((v) =>
      v !== undefined && v !== null && v !== '')
}
