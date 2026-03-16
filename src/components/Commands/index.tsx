import { CommandList } from '@ttab/elephant-ui'
import { ClearFilter } from '@/components/Filter/ClearFilter'
import { ColumnFilter } from './Items'
import { useTable } from '@/hooks/useTable'
import { useQuery } from '@/hooks/index'
import { useMemo, type JSX } from 'react'
import { FreeTextFilter } from '../Filter/common/FreeTextFilter'

export const Commands = ({ filterType }: { filterType?: 'freetext' | 'filterOptions' }): JSX.Element => {
  const { table, command } = useTable()
  const [, setFilter] = useQuery(['query'])
  const { setSearch } = command

  const state = table.getState()
  const hasFilter = !!state.columnFilters.length || typeof state.globalFilter === 'string'

  const isFreetext = useMemo(() => filterType === 'freetext', [filterType])

  const handleClear = () => {
    table.resetColumnFilters()
    table.resetGlobalFilter()
  }

  const handleInputChange = (value: string) => {
    if (isFreetext) {
      if (value) {
        if (table.setGlobalFilter) {
          table.setGlobalFilter(value)
        } else {
          setFilter({ query: [value] })
        }
      } else {
        if (table.resetGlobalFilter) {
          table.resetGlobalFilter()
        } else {
          setFilter({ query: [] })
        }
      }
    } else {
      setSearch(value)
    }
  }

  return (
    <>
      {filterType !== 'freetext' && (
        <FreeTextFilter filterType={filterType ?? 'filterOptions'} value='' onChange={handleInputChange} />
      )}
      <CommandList>
        {filterType === 'freetext' && (
          <FreeTextFilter filterType={filterType ?? ''} value='' onChange={handleInputChange} />
        )}
        <ColumnFilter />
        <ClearFilter hasFilter={hasFilter} onClear={handleClear} />
      </CommandList>
    </>
  )
}
