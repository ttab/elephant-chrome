import { useCallback, useMemo } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { DotDropdownMenu } from '../ui/DotMenu'
import type { QueryParams } from '@/hooks/useQuery'
import { toast } from 'sonner'
import { useUserTracker } from '@/hooks/useUserTracker'
import { columnFilterToQuery, queryToColumnFilter } from '@/lib/loadFilters'
import { useSections } from '@/hooks/useSections'
import { useTable } from '@/hooks/useTable'

import type { ColumnDef, ColumnFiltersState } from '@tanstack/react-table'

import { Save, UserCog } from '@ttab/elephant-ui/icons'


export const QuickFilter = <TData,>({ columns }: { columns: ColumnDef<TData>[] }): JSX.Element => {
  const { table, type } = useTable<TData>()
  const column = table.getColumn('section')

  const [userFilters, setUserFilters] = useUserTracker<QueryParams | undefined>(`filters.${type}.user`)
  const columnFilterValue = column?.getFilterValue()

  const savedUserFilters = useMemo(() => {
    if (!userFilters) return undefined
    return queryToColumnFilter<TData>(userFilters, columns)
  }, [userFilters, columns])

  const { columnFilters } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string
  }
  const allSections = useSections()

  const isUserFilter = useCallback((saved?: ColumnFiltersState, current?: ColumnFiltersState) => {
    const stableStringify = (arr: ColumnFiltersState) =>
      JSON.stringify([...arr].sort((a, b) => a.id.localeCompare(b.id)))

    if (!saved || !current) return false
    return stableStringify(saved) === stableStringify(current)
  }, [])

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
  )
}
