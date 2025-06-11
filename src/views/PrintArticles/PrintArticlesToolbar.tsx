import { Filter, type FilterProps } from '@/components/Filter'
import { SelectedFilters } from './SelectedFilters'
import { Commands } from './Commands'
import { useCallback, useMemo, useState } from 'react'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Save, UserCog } from '@ttab/elephant-ui/icons'
import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { useTable } from '@/hooks/useTable'
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
import { useUserTracker } from '@/hooks/useUserTracker'
import { QueryParams } from '@/hooks/useQuery'
import { useSections } from '@/hooks/useSections'
import { columnFilterToQuery, loadFilters } from '@/lib/loadFilters'
import { PrintArticle } from '@/hooks/index/useDocuments/schemas/printArticle'
import { columns } from './columns'
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
  const { table, type, command } = useTable<PrintArticle>()
  const { columnFilters, globalFilter } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string
  }
  const isFiltered = useMemo(() => columnFilters.length > 0
    || !!globalFilter, [columnFilters, globalFilter])
  const allSections = useSections()
  const column = table.getColumn('printFlow')
  const [filters, setFilters] = useUserTracker<QueryParams | undefined>(`filters.${type}`)
  const columnFilterValue = column?.getFilterValue()
  const savedUserFilter = useMemo(() => {
    console.log('savedUserFilter', filters, columns)
    return [] // loadFilters<PrintArticle>(filters, columns)
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

  // console.log('columnFilterValue', columnFilterValue, 'savedUserFilter', savedUserFilter, 'columnFilters', columnFilters)
  const handleResetFilters = () => {
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }

  const handleSaveUserFilter = () => {
    const columnFilters = table.getState().columnFilters
    console.log('handleSaveUserFilter', columnFilters)
    setFilters(columnFilterToQuery(columnFilters))

    toast.success('Ditt filter har sparats')
  }

  const handleToggleGroupValue = useCallback(() => {
    console.log('handleToggleGroupValue', columnFilterValue, 'columnFilters', columnFilters)
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
            key='nyheter'
            value={['6eaca8e0-22d9-54de-8881-9afde05be217'].join(',')}
            aria-label='Toggle nyheter'
            className='border data-[state=off]:text-muted-foreground'
          >
            Nyheter
          </ToggleGroupItem>
          <ToggleGroupItem
            key='tv'
            value={[
              'd2cebd5d-8d3e-5b6d-9cf5-df8f5b4049ad',
              'f32b11e4-9d3f-537a-a683-81a1b014be25',
              '4ad81610-d063-52e9-b0ac-b424821c9119',
              '44522ab9-4419-5efd-9b32-b8de9a7385c6',
              'ae53f29d-d588-527a-9a61-e78e78c2a7ac',
              '4a0eebdb-c315-5358-962a-896546efaa9e',
              'd74279ee-3608-5ead-92c3-9beb4848acfd'].join(',')}
            aria-label='Toggle tv'
            className='border data-[state=off]:text-muted-foreground'
          >
            TV
          </ToggleGroupItem>
          <ToggleGroupItem
            key='expressen'
            value={['85c43dcf-eee6-5952-bf41-e5c818134422', '97981bcb-127f-5af7-b750-b3ba4c709ef1'].join(',')}
            aria-label='Toggle expressen'
            className='border data-[state=off]:text-muted-foreground'
          >
            Expressen
          </ToggleGroupItem>
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
