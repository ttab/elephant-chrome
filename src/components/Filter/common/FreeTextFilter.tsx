import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery, useTable } from '@/hooks/index'
import { CommandItem } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { useMemo, useState, type JSX } from 'react'

export const FreeTextFilter = ({ filterType }: { filterType: string }): JSX.Element => {
  const { table, command } = useTable()
  const [filter, setFilter] = useQuery(['query'])
  const [selected, setSelected] = useState(true)
  const { setSearch, search } = command

  const filterTypeValue = useMemo(() => {
    if (filterType === 'freetext') {
      return filterType
    }
  }, [filterType])

  const handleInputChange = (value: string | undefined) => {
    if (filterTypeValue === 'freetext') {
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
      console.log('filter type is not freetext, not setting search:', value)
      if (value) {
        setSearch(value)
      } else {
        setSearch('')
      }
      console.log('setting search:', search)
    }
  }

  return (
    <CommandItem
      forceMount={true}
      key='freetext'
      value='freetext'
      onKeyUp={(e) => {
        if (e.currentTarget.getAttribute('data-selected') === 'true') {
          setSelected(true)
        } else {
          setSelected(false)
        }
      }}
      className={cn('pb-0 mb-1.5 bg-white!',
        (filterType === 'freetext') && 'data-[selected=true]:shadow-[inset_0_0px_3px_rgba(0,0,0,0.5)]')}
    >
      <DebouncedCommandInput
        value={filter?.query?.[0] ?? search ?? ''}
        onChange={(value) => handleInputChange(value)}
        placeholder={filterType === 'freetext' ? 'Fritext' : 'Sök alternativ'}
        className='h-9'
        autoFocus={true}
        readOnly={!selected && filterType === 'freetext'}
      />
    </CommandItem>
  )
}
