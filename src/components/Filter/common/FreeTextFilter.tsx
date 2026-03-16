import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { CommandItem } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { useState, type JSX } from 'react'

interface FreeTextFilterProps {
  value: string
  onChange: (value: string) => void
  filterType: 'freetext' | 'filterOptions'
  autoFocus?: boolean
}

export const FreeTextFilter = ({ value, onChange, filterType, autoFocus = true }: FreeTextFilterProps): JSX.Element => {
  const [selected, setSelected] = useState(true)
  return (
    <CommandItem
      forceMount={true}
      key='freetext'
      value='freetext'
      onKeyUp={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (e.currentTarget.getAttribute('data-selected') === 'true') {
            setSelected(true)
          } else {
            setSelected(false)
          }
        }
      }}
      className={cn('pb-0 mb-1.5 bg-white!',
        filterType === 'freetext' && 'data-[selected=true]:shadow-[inset_0_0px_3px_rgba(0,0,0,0.5)]')}
    >
      <DebouncedCommandInput
        value={value}
        onChange={(v) => onChange(v ?? '')}
        placeholder={filterType === 'freetext' ? 'Fritext' : 'Sök alternativ'}
        className='h-9'
        autoFocus={autoFocus}
        readOnly={filterType === 'freetext' && !selected ? true : false}
      />
    </CommandItem>
  )
}
