import { useTable } from '@/hooks'
import { CommandItem } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'

export const ClearFilter = (): JSX.Element | null => {
  const { table } = useTable()

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
