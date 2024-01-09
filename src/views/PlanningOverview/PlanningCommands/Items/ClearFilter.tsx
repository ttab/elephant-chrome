import { type Table } from '@tanstack/react-table'
import { CommandItem } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'
import { type Planning } from '../../PlanningTable/data/schema'

interface ClearFilterProps {
  table: Table<Planning>
}
export const ClearFilter = ({ table }: ClearFilterProps): JSX.Element | null => {
  const { columnFilters, globalFilter } = table.getState()

  return columnFilters.length || globalFilter
    ? <CommandItem
      onSelect={() => {
        table.resetColumnFilters()
        table.resetGlobalFilter()
      }}
    >
      <X className='h-4 w-3' />
      Clear filters
    </CommandItem>
    : null
}
