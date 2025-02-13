import { useTable } from '@/hooks'
import { CommandItem } from '@ttab/elephant-ui'
import { X } from '@ttab/elephant-ui/icons'

export const ClearFilter = (): JSX.Element | null => {
  const { table } = useTable()

  const { columnFilters, globalFilter } = table.getState()

  return columnFilters.length || globalFilter
    ? (
        <CommandItem
          onSelect={() => {
            table.resetColumnFilters()
            table.resetGlobalFilter()
          }}
        >
          <X size={18} strokeWidth={1.75} />
          Rensa filter
        </CommandItem>
      )
    : null
}
