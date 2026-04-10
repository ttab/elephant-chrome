import { useCallback, useMemo, type JSX } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { DotMenu } from '@/components/ui/DotMenu'
import type { QueryParams } from '@/hooks/useQuery'
import { toast } from 'sonner'
import { useUserTracker } from '@/hooks/useUserTracker'
import { columnFilterToQuery, queryToColumnFilter } from '@/lib/loadFilters'
import { useTable } from '@/hooks/useTable'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { SaveIcon, UserCogIcon } from '@ttab/elephant-ui/icons'

export const QuickFilter = <TData,>(): JSX.Element => {
  const { table, type } = useTable<TData>()
  const columns = table.getAllColumns()
  const quickFilterColumn = useMemo(
    () => columns.find((column) => column.columnDef.meta?.quickFilter),
    [columns]
  )

  const quickFilterOptions = useMemo(
    () => quickFilterColumn?.columnDef.meta?.options || [],
    [quickFilterColumn?.columnDef.meta?.options]
  )

  const [userFilters, setUserFilters] = useUserTracker<QueryParams | undefined>(`filters.${type}.user`)

  const savedUserFilters = useMemo(() => {
    if (!userFilters) return undefined
    return queryToColumnFilter<TData>(userFilters, columns)
  }, [userFilters, columns])

  const { columnFilters } = table.getState() as {
    columnFilters: ColumnFiltersState
    globalFilter: string
  }

  const areFiltersEqual = useCallback((filterA?: ColumnFiltersState, filterB?: ColumnFiltersState) => {
    if (!filterA || !filterB) return false
    if (filterA.length !== filterB.length) return false

    const sortedA = [...filterA].sort((a, b) => a.id.localeCompare(b.id))
    const sortedB = [...filterB].sort((a, b) => a.id.localeCompare(b.id))

    return JSON.stringify(sortedA) === JSON.stringify(sortedB)
  }, [])

  const isUserFilterActive = useMemo(
    () => areFiltersEqual(savedUserFilters, columnFilters),
    [savedUserFilters, columnFilters, areFiltersEqual]
  )

  const handleSaveUserFilter = useCallback(() => {
    setUserFilters(columnFilterToQuery(columnFilters))
    toast.success('Ditt filter har sparats')
  }, [setUserFilters, columnFilters])

  const currentQuickFilterValue = quickFilterColumn?.getFilterValue()

  const toggleGroupValue = useMemo(() => {
    if (isUserFilterActive) return 'user'

    return Array.isArray(currentQuickFilterValue) && currentQuickFilterValue.length === 1
      ? currentQuickFilterValue[0] as string
      : ''
  }, [currentQuickFilterValue, isUserFilterActive])

  const handleToggleValueChange = useCallback((value: string | undefined) => {
    if (value === 'user' && savedUserFilters) {
      table.setColumnFilters(savedUserFilters)
      return
    }

    if (value === '' && isUserFilterActive) {
      table.resetColumnFilters()
      return
    }

    if (value !== 'user') {
      quickFilterColumn?.setFilterValue(value ? [value] : undefined)
    }
  }, [savedUserFilters, table, quickFilterColumn, isUserFilterActive])

  const quickFilterMenuItems = useMemo(() =>
    quickFilterOptions.map((option) => ({
      label: option.label,
      item: () => quickFilterColumn?.setFilterValue([option.value])
    })), [quickFilterOptions, quickFilterColumn])

  const mobileDropdownItems = useMemo(() => [
    ...quickFilterMenuItems,
    {
      label: 'Personligt filter',
      icon: UserCogIcon,
      item: () => savedUserFilters && table.setColumnFilters(savedUserFilters),
      disabled: !savedUserFilters
    },
    {
      label: 'Spara personligt filter',
      icon: SaveIcon,
      item: handleSaveUserFilter
    }
  ], [quickFilterMenuItems, savedUserFilters, table, handleSaveUserFilter])

  const saveFilterMenuItem = useMemo(() => [{
    label: 'Spara personligt filter',
    icon: SaveIcon,
    item: handleSaveUserFilter
  }], [handleSaveUserFilter])

  return (
    <div className='flex flex-row flex-grow flex-wrap items-center'>
      <div className='flex-grow'></div>
      <div className='hidden @2xl/view:flex'>
        <ToggleGroup
          type='single'
          size='xs'
          value={toggleGroupValue}
          onValueChange={handleToggleValueChange}
          className='px-1'
        >
          {quickFilterOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={`Toggle ${option.label}`}
              className='border data-[state=off]:text-muted-foreground'
            >
              {option.label}
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem
            value='user'
            disabled={!savedUserFilters}
            aria-label='Toggle user filter'
            className='border data-[state=off]:text-muted-foreground'
          >
            <UserCogIcon size={18} strokeWidth={1.75} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className='hidden @2xl/view:flex justify-end'>
        <DotMenu
          trigger='vertical'
          items={saveFilterMenuItem}
        />
      </div>
      <div className='flex justify-end @2xl/view:hidden'>
        <DotMenu
          trigger='vertical'
          items={mobileDropdownItems}
        />
      </div>
    </div>
  )
}
