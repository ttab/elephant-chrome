import { XIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useTable } from '@/hooks/useTable'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { Filter } from '@/components/Filter'
import { Commands } from '@/components/Commands'
import { Sort } from '../Sort'
import { useMemo, useCallback, type JSX } from 'react'
import { QuickFilter } from './QuickFilter'
import { SearchBar } from '@/components/SearchBar/SearchBar'

interface ToolsetProps {
  searchbar?: boolean
  searchPlaceholder?: string
  filter?: boolean
  sort?: boolean
  selectedFilters?: boolean
  quickFilter?: boolean
}

export const Toolbar = <TData,>({ searchbar = false, searchPlaceholder = 'Sök', filter = true, sort = true, selectedFilters = true, quickFilter = true }: ToolsetProps): JSX.Element => {
  const { table, command } = useTable<TData>()

  const { columnFilters, globalFilter } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string
  }

  const filterLength = useMemo(() => columnFilters.length + (globalFilter ? 1 : 0),
    [columnFilters, globalFilter])

  const handleResetFilters = useCallback(() => {
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }, [table])

  return (
    <div className='bg-background flex flex-wrap grow items-center space-x-2 border-b px-4 py-1 pr-2.5 sticky top-0 z-10'>
      {filter
        && (
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
        )}
      { sort
        && <Sort />}
      {selectedFilters
        && <SelectedFilters table={table} />}
      {filterLength > 1 && (
        <Button
          variant='ghost'
          onClick={handleResetFilters}
          className='h-8 px-2 lg:px-3'
        >
          Rensa
          <XIcon size={18} strokeWidth={1.75} className='ml-2' />
        </Button>
      )}
      {searchbar && (
        <SearchBar
          className='w-fit'
          onChange={(value) => table.setGlobalFilter(value ?? '')}
          value={table.getState().globalFilter as string ?? ''}
          placeholder={searchPlaceholder}
        />
      )}
      {quickFilter
        && <QuickFilter />}
    </div>
  )
}
