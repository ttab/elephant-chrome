import { XIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import { useTable } from '@/hooks/useTable'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { useMemo, useCallback } from 'react'
import { SelectedFilters } from '@/components/Table/SelectedFilters'
import { QuickFilter } from '@/components/Table/QuickFilter'
import { Searchbar } from './SearchBar'

export const ConceptsToolbar = <TData,>({ placeholder }: { placeholder: string }): JSX.Element => {
  const { table, command } = useTable<TData>()
  console.log(table)
  const { columnFilters, globalFilter } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string
  }
  const isFiltered = useMemo(() => columnFilters.length > 0 || !!globalFilter,
    [columnFilters, globalFilter])

  const handleResetFilters = useCallback(() => {
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }, [table])

  return (
    <div className='bg-background flex flex-wrap grow items-center space-x-2 border-b px-4 py-1 pr-2.5 sticky top-0 z-10'>
      <Searchbar placeholder={placeholder} />
      <SelectedFilters table={table} />
      {isFiltered && (
        <Button
          variant='ghost'
          onClick={handleResetFilters}
          className='h-8 px-2 lg:px-3'
        >
          Rensa
          <XIcon size={18} strokeWidth={1.75} className='ml-2' />
        </Button>
      )}
      <QuickFilter />
    </div>
  )
}
