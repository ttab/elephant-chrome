import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { TextFilter, ColumnFilter } from './Items'
import { useTable } from '@/hooks/useTable'

export const Commands = (): JSX.Element => {
  const { table } = useTable()
  const state = table.getState()

  const hasFilter = !!state.columnFilters.length || typeof state.globalFilter === 'string'

  const handleClear = () => {
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }

  return (
    <CommandList>
      <TextFilter />
      <ColumnFilter />
      <ClearFilter hasFilter={hasFilter} onClear={handleClear} />
    </CommandList>
  )
}
