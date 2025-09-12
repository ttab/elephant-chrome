import type { QueryParams } from '@/hooks/useQuery'
import type { ColumnDef, ColumnFiltersState, Updater } from '@tanstack/react-table'

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

export function queryToColumnFilter<TData>(obj: QueryParams, columns: ColumnDef<TData>[]): ColumnFiltersState {
  return Object.entries(obj)
    .filter(([key]) => columns
      .some((column) => column.id === key))
    .map(([key, value]) => ({
      id: key,
      value: Array.isArray(value) ? value : [value]
    }))
}

export function hasDefinedFilter(obj?: QueryParams): boolean {
  return !!obj && Object
    .values(obj)
    .some((v) =>
      v !== undefined && v !== null && v !== '')
}
