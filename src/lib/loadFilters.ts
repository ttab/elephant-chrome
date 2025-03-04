import type { QueryParams } from '@/hooks/useQuery'
import type { ColumnDef, ColumnFiltersState, Updater } from '@tanstack/react-table'

/**
 * Loads filters for columns based on query parameters and saved filters.
 *
 * @template T - The type of the column data.
 * @param query - The query parameters from the URL or other sources.
 * @param columns - The definitions of the columns to filter.
 * @param savedFilters - The previously saved filters.
 * @returns The state of the column filters.
 */
export function loadFilters<T>(
  query: QueryParams | undefined,
  columns: ColumnDef<T>[],
  savedFilters: QueryParams | undefined
): ColumnFiltersState {
  // Query filters take precedence over saved filters
  const filtersWithPrecedence = Object.keys(query || {}).length > 0
    ? query
    : savedFilters || {}

  // Get all query parameters that match the column ids
  const filters = Object.entries(filtersWithPrecedence || {}).filter(([key]) =>
    columns.some((column) => column.id === key)
  )

  // Arrange query params into a ColumnFiltersState
  return filters.map(([key, value]) =>
    ({ id: key, value: Array.isArray(value) ? value : [value] }))
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
