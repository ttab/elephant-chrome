import { Save, X } from '@ttab/elephant-ui/icons'

import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useSections } from '@/hooks/useSections'
import { DotDropdownMenu } from '../ui/DotMenu'
import { useUserTracker } from '@/hooks/useUserTracker'
import { columnFilterToQuery } from '@/lib/loadFilters'
import { useTable } from '@/hooks/useTable'

export const Toolbar = <TData,>(): JSX.Element => {
  const { table, type } = useTable<TData>()
  const isFiltered = table.getState().columnFilters.length > 0
    || !!table.getState().globalFilter

  const allSections = useSections()
  const column = table.getColumn('section')
  const [, setFilters] = useUserTracker(`filters.${type}`)

  const columnFilterValue = column?.getFilterValue()

  return (
    <div className='flex items-center justify-between py-1 pr-2.5'>
      <div className='flex flex-1 items-center space-x-2'>
        <SelectedFilters table={table} />
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              table.resetGlobalFilter()
            }}
            className='h-8 px-2 lg:px-3'
          >
            Rensa
            <X size={18} strokeWidth={1.75} className='ml-2' />
          </Button>
        )}
      </div>
      <ToggleGroup
        type='single'
        size='xs'
        value={Array.isArray(columnFilterValue) && columnFilterValue.length === 1
          ? columnFilterValue[0] as string
          : undefined}
        onValueChange={(value) => {
          column?.setFilterValue(value ? [value] : undefined)
        }}
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
      </ToggleGroup>
      <DotDropdownMenu
        trigger='vertical'
        items={[
          {
            label: 'Spara filter',
            icon: Save,
            item: () => {
              const columnFilters = table.getState().columnFilters
              setFilters(columnFilterToQuery(columnFilters))
            }
          }
        ]}
      />
    </div>
  )
}
