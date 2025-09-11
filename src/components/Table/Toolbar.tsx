import { Save, UserCog, X } from '@ttab/elephant-ui/icons'
import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useSections } from '@/hooks/useSections'
import { DotDropdownMenu } from '../ui/DotMenu'
import { useUserTracker } from '@/hooks/useUserTracker'
import { columnFilterToQuery, queryToColumnFilter } from '@/lib/loadFilters'
import { useTable } from '@/hooks/useTable'
import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'
import type { QueryParams } from '@/hooks/useQuery'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { Filter } from '@/components/Filter'
import { Commands } from '@/components/Commands'
import { Sort } from '../Sort'

export const Toolbar = <TData,>({ columns }: { columns: ColumnDef<TData>[] }): JSX.Element => {
  const { table, type, command } = useTable<TData>()
  const { columnFilters, globalFilter } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string
  }
  const allSections = useSections()
  const column = table.getColumn('section')
  const [userFilters, setUserFilters] = useUserTracker<QueryParams | undefined>(`filters.${type}.user`)
  const columnFilterValue = column?.getFilterValue()

  const savedUserFilters = useMemo(() => {
    if (!userFilters) return undefined
    return queryToColumnFilter<TData>(userFilters, columns)
  }, [userFilters, columns])

  const isUserFilter = useCallback((saved?: ColumnFiltersState, current?: ColumnFiltersState) => {
    const stableStringify = (arr: ColumnFiltersState) =>
      JSON.stringify([...arr].sort((a, b) => a.id.localeCompare(b.id)))

    if (!saved || !current) return false
    return stableStringify(saved) === stableStringify(current)
  }, [])

  const isFiltered = useMemo(() => columnFilters.length > 0 || !!globalFilter,
    [columnFilters, globalFilter])

  const handleResetFilters = useCallback(() => {
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }, [table])

  const handleSaveUserFilter = useCallback(() => {
    setUserFilters(columnFilterToQuery(table.getState().columnFilters))
    toast.success('Ditt filter har sparats')
  }, [setUserFilters, table])

  const handleToggleGroupValue = useMemo(() => {
    if (isUserFilter(savedUserFilters, columnFilters)) return 'user'

    return Array.isArray(columnFilterValue) && columnFilterValue.length === 1
      ? columnFilterValue[0] as string
      : ''
  }, [columnFilterValue, savedUserFilters, columnFilters, isUserFilter])

  const handleToggleValueChange = useCallback((value: string | undefined) => {
    if (value === 'user' && savedUserFilters) {
      table.setColumnFilters(savedUserFilters)
      return
    }

    if (value === '' && isUserFilter(savedUserFilters, table.getState().columnFilters)) {
      table.resetColumnFilters()
      return
    }

    if (value !== 'user') {
      column?.setFilterValue(value ? [value] : undefined)
    }
  }, [savedUserFilters, table, column, isUserFilter])

  // Dropdown menu items memoized
  const sectionMenuItems = useMemo(() =>
    allSections.map((section) => ({
      label: section.title,
      item: () => column?.setFilterValue([section.id])
    })), [allSections, column])

  const dropdownItems = useMemo(() => [
    ...sectionMenuItems,
    {
      label: 'Personligt filter',
      icon: UserCog,
      item: () => savedUserFilters && table.setColumnFilters(savedUserFilters)
    },
    {
      label: 'Spara personligt filter',
      icon: Save,
      item: handleSaveUserFilter
    }
  ], [sectionMenuItems, savedUserFilters, table, handleSaveUserFilter])

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
      <Sort />
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
            value={handleToggleGroupValue}
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
              disabled={!savedUserFilters}
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
            items={dropdownItems}
          />
        </div>
      </div>
    </div>
  )
}
