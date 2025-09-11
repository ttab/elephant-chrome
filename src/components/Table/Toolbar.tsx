import { XIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useTable } from '@/hooks/useTable'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { Filter } from '@/components/Filter'
import { Commands } from '@/components/Commands'
import { Sort } from '../Sort'
import type { PropsWithChildren } from 'react'
import { useMemo, useCallback } from 'react'

export const Toolbar = <TData,>({ children }: PropsWithChildren): JSX.Element => {
  const { table, command } = useTable<TData>()

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
      <Filter
        page={command.page}
        pages={command.pages}
        setPages={command.setPages}
        search={command.search}
        setSearch={command.setSearch}
        setGlobalTextFilter={table.setGlobalFilter}
      >
        <Commands />
      </Filter>
      <Sort />
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
      {children}
    </div>
  )
}
