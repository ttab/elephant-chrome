import { Filter, type FilterProps } from '@/components/Filter'
import { SelectedFilters } from './SelectedFilters'
import { Commands } from './Commands'
import { useCallback, useMemo, useState } from 'react'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Save, UserCog } from '@ttab/elephant-ui/icons'
import { ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { useTable } from '@/hooks/useTable'
import { type ColumnDef, type ColumnFiltersState } from '@tanstack/react-table'
import { useUserTracker } from '@/hooks/useUserTracker'
import { type QueryParams } from '@/hooks/useQuery'
import { columnFilterToQuery } from '@/lib/loadFilters'
import { toast } from 'sonner'

/**
 * Toolbar component.
 *
 * This component renders a toolbar with a button that currently triggers an alert
 * when clicked. The button is styled with a ghost variant and includes an icon
 * for filtering lists.
 *
 * @returns The rendered Toolbar component.
 *
 * @remarks
 * The component is designed to be sticky at the top of the page and includes
 * a border at the bottom. The button's functionality is not yet implemented.
 */


export const Toolbar = <PrintArticle,>({ columns }: {
  columns: ColumnDef<PrintArticle>[]
}): JSX.Element => {
  const { table, type } = useTable<PrintArticle>()
  const { columnFilters } = table.getState() as {
    columnFilters: ColumnFiltersState
  }
  const column = table.getColumn('printFlow')
  const [filters, setFilters] = useUserTracker<QueryParams | undefined>(`filters.${type}`)
  const columnFilterValue = column?.getFilterValue()
  const savedUserFilter = useMemo(() => {
    return []
  }, [filters, columns])

  const isUserFilter = (savedUserFilter: ColumnFiltersState, currentFilter: ColumnFiltersState): boolean => (
    JSON.stringify(savedUserFilter.sort()) === JSON.stringify(currentFilter.sort())
  )

  const [pages, setPages] = useState<string[]>([])
  const [search, setSearch] = useState<string | undefined>('')

  const page = pages[pages.length - 1] || ''
  const props: FilterProps = {
    page,
    pages,
    setPages,
    search,
    setSearch
  }

  const handleSaveUserFilter = () => {
    const columnFilters = table.getState().columnFilters
    setFilters(columnFilterToQuery(columnFilters))

    toast.success('Ditt filter har sparats')
  }

  const handleToggleGroupValue = useCallback(() => {
    if (isUserFilter(savedUserFilter, columnFilters)) {
      return 'user'
    }

    return Array.isArray(columnFilterValue) && columnFilterValue.length === 1
      ? columnFilterValue[0] as string
      : ''
  }, [columnFilterValue, savedUserFilter, columnFilters])

  const handleToggleValueChange = (value: string | undefined) => {
    if (value === 'user') {
      table.setColumnFilters(savedUserFilter)
      return
    }

    // If current filter is userFilter, reset all filters
    if (value === '' && isUserFilter(savedUserFilter, table.getState().columnFilters)) {
      table.resetColumnFilters()
      return
    }

    column?.setFilterValue(value ? [value] : undefined)
  }

  return (
    <div className='bg-white z-10 flex items-center justify-between py-1 px-4 border-b sticky top-0'>
      <div className='flex flex-1 items-center space-x-2'>
        <Filter {...props}>
          <Commands {...props} />
        </Filter>
        <SelectedFilters />
      </div>
      <div className='flex flex-row flex-grow flex-wrap items-center'>
      </div>
      <div className='flex justify-end'>
        <ToggleGroup
          type='single'
          size='xs'
          value={(() => handleToggleGroupValue())()}
          onValueChange={handleToggleValueChange}
          className='px-1'
        >
          <ToggleGroupItem
            value='user'
            aria-label='Toggle user'
            className='border data-[state=off]:text-muted-foreground'
          >
            <UserCog size={18} strokeWidth={1.75} />
          </ToggleGroupItem>
        </ToggleGroup>
        <DotDropdownMenu
          trigger='vertical'
          items={[
            {
              label: 'Spara personligt filter',
              icon: Save,
              item: handleSaveUserFilter
            }
          ]}
        />
      </div>
    </div>
  )
}
