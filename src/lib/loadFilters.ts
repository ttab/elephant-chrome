import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
export function loadFilters<T>(query: Record<string, string | string[] | undefined>, columns: ColumnDef<T>[]): ColumnFiltersState {
  const filters = Object.entries(query).filter(([key]) =>
    columns.some((column) => column.id === key)
  )

  return filters.map(([key, value]) =>
    ({ id: key, value: Array.isArray(value) ? value : [value] }))
}
