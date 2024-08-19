import { type Column, type Row } from '@tanstack/react-table'

/**
  * Get unique values for a column containing an array of values in a faceted row model
*/
export function getNestedFacetedUniqueValues<TData, TValue>(
  column: Column<TData, TValue> | undefined
): Map<string, number> {
  const uniqueValues = new Map<string, number>()

  if (!column) {
    return uniqueValues
  }

  const facetedRowModel = column.getFacetedRowModel()

  facetedRowModel?.flatRows.forEach((row: Row<TData>) => {
    const columnValues = row.getValue<string[] | undefined>(column.id)
    columnValues?.forEach((value) => {
      uniqueValues.set(value, (uniqueValues.get(value) || 0) + 1)
    })
  })
  return uniqueValues
}
