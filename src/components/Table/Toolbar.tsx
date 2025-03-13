import { Save, UserCog, X } from '@ttab/elephant-ui/icons'
import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useSections } from '@/hooks/useSections'
import { DotDropdownMenu } from '../ui/DotMenu'
import { useUserTracker } from '@/hooks/useUserTracker'
import { columnFilterToQuery, loadFilters } from '@/lib/loadFilters'
import { useTable } from '@/hooks/useTable'
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
import type { QueryParams } from '@/hooks/useQuery'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Filter } from '@/components/Filter'
import { Commands } from '@/components/Commands'

export const Toolbar = <TData,>({ columns }: {
  columns: ColumnDef<TData>[]
}): JSX.Element => {
  const { table, type, command } = useTable<TData>()
  const { columnFilters, globalFilter } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string
  }
  const isFiltered = useMemo(() => columnFilters.length > 0
    || !!globalFilter, [columnFilters, globalFilter])
  const allSections = useSections()
  const column = table.getColumn('section')
  const [filters, setFilters] = useUserTracker<QueryParams | undefined>(`filters.${type}`)
  const columnFilterValue = column?.getFilterValue()

  const savedUserFilter = useMemo(() =>
    loadFilters<TData>(filters, columns), [filters, columns])

  const isUserFilter = (savedUserFilter: ColumnFiltersState, currentFilter: ColumnFiltersState): boolean => (
    JSON.stringify(savedUserFilter.sort()) === JSON.stringify(currentFilter.sort())
  )

  const handleResetFilters = () => {
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }

  const handleSaveUserFilter = () => {
    const columnFilters = table.getState().columnFilters
    setFilters(columnFilterToQuery(columnFilters))

    toast.success('Ditt filter har sparats')
  }

  const handleToggleGroupValue = () => {
    if (isUserFilter(savedUserFilter, columnFilters)) {
      return 'user'
    }

    return Array.isArray(columnFilterValue) && columnFilterValue.length === 1
      ? columnFilterValue[0] as string
      : undefined
  }

  const handleToggleValueChange = (value: string | undefined) => {
    if (value === 'user') {
      table.setColumnFilters(savedUserFilter)
      return
    }
    column?.setFilterValue(value ? [value] : undefined)
  }

  return (
    <div className='flex flex-wrap flex-grow items-center space-x-2 border-b px-4 py-1 pr-2.5 sticky top-0 bg-white z-10'>
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
      <SelectedFilters table={table} />
      {isFiltered && (
        <Button
          variant='ghost'
          onClick={handleResetFilters}
          className='h-8 px-2 lg:px-3'
        >
          Rensa
          <X size={18} strokeWidth={1.75} className='ml-2' />
        </Button>
      )}
      <div className='flex flex-row flex-grow flex-wrap items-center'>
        <div className='flex-grow'></div>
        <div className='hidden @2xl/view:flex'>
          <ToggleGroup
            type='single'
            size='xs'
            value={(() => handleToggleGroupValue())()}
            onValueChange={handleToggleValueChange}
            className='px-1'
          >
            {allSections.map((section) => (
              <ToggleGroupItem
                key={section.id}
                value={section.id}
                aria-label={`Toggle ${section.title}`}
                className='border data-[state=off]:text-muted-foreground'
              >
                {section.title}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value='user'
              aria-label='Toggle user'
              className='border data-[state=off]:text-muted-foreground'
            >
              <UserCog size={18} strokeWidth={1.75} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className='hidden @2xl/view:flex justify-end'>
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
        <div className='flex justify-end @2xl/view:hidden'>
          <DotDropdownMenu
            trigger='vertical'
            items={[
              ...allSections.map((section) => ({
                label: section.title,
                item: () => {
                  column?.setFilterValue([section.id])
                }
              })),
              {
                label: 'Personligt filter',
                icon: UserCog,
                item: () => {
                  table.setColumnFilters(savedUserFilter)
                }
              },
              {
                label: 'Spara personligt filter',
                icon: Save,
                item: handleSaveUserFilter
              }
            ]}
          />
        </div>
      </div>
    </div>
  )
}
