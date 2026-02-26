import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery, useTable } from '@/hooks/index'
import { CommandItem } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { useState, type JSX } from 'react'

export const FreeTextFilter = (): JSX.Element => {
  const { table } = useTable()
  const [filter, setFilter] = useQuery(['query'])
  const [selected, setSelected] = useState(true)
  const handleInputChange = (value: string | undefined) => {
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
  }

  return (
    <CommandItem
      value='freetext'
      autoFocus={selected}
      onKeyUp={(e) => {
        if (e.currentTarget.getAttribute('data-selected') === 'true') {
          setSelected(true)
        } else {
          setSelected(false)
        }
      }}
      className={cn('pb-0 mb-1.5',
        ' data-[selected=true]:bg-white! data-[selected=true]:shadow-[inset_0_0px_3px_rgba(0,0,0,0.5)]')}
    >
      <DebouncedCommandInput
        value={filter?.query?.[0] ?? ''}
        onChange={(value) => handleInputChange(value)}
        placeholder='Fritext'
        className='h-9'
        autoFocus={true}
        readOnly={!selected}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && selected && e.currentTarget.value) {
            e.stopPropagation()
          }
        }}
      />
    </CommandItem>
  )
}
