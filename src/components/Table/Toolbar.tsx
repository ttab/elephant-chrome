import { X } from '@ttab/elephant-ui/icons'
import { type Table } from '@tanstack/react-table'

import { Button, ToggleGroup, ToggleGroupItem } from '@ttab/elephant-ui'
import { SelectedFilters } from './SelectedFilters'
import { useSections } from '@/hooks/useSections'

export const Toolbar = <TData,>({
  table
}: {
  table: Table<TData>
}): JSX.Element => {
  const isFiltered = table.getState().columnFilters.length > 0
    || !!table.getState().globalFilter

  const allSections = useSections()
  const column = table.getColumn('section')

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
        type='multiple'
        size='xs'
        value={column?.getFilterValue() as string[] | undefined || []}
        onValueChange={(value) => {
          column?.setFilterValue(value.length ? value : undefined)
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
    </div>
  )
}
