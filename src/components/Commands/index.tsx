import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { ColumnFilter } from './Items'
import { useTable } from '@/hooks/useTable'
import type { JSX } from 'react'
import { FreeTextFilter } from '../Filter/common/FreeTextFilter'

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
      <FreeTextFilter />
      <ColumnFilter />
      <ClearFilter hasFilter={hasFilter} onClear={handleClear} />
    </CommandList>
  )
}
