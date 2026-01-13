import { Command } from '@ttab/elephant-ui'
import type { Updater } from '@tanstack/react-table'
import { useTable } from '@/hooks/useTable'
import { DebouncedCommandInput } from '../Commands/Menu/DebouncedCommandInput'

export const SearchBar = ({ placeholder, setGlobalTextFilter }: {
  setGlobalTextFilter: (updater: Updater<unknown>) => void
  placeholder: string
}): JSX.Element => {
  const { table } = useTable()
  const { globalFilter } = table.getState() as {
    globalFilter: string
  }
  const handleChange = (value: string | undefined): void => {
    if (value) {
      setGlobalTextFilter(value)
    } else {
      setGlobalTextFilter('')
    }
  }
  return (
    <div className='bg-table-bg flex items-center justify-between sticky top-0 z-1 flex-auto'>
      <div className='flex flex-1 items-center space-x-2'>
        <Command
          className='[&_[cmdk-input-wrapper]]:border-none'
        >
          <DebouncedCommandInput
            value={globalFilter ?? ''}
            onChange={(value: string | undefined) => handleChange(value ?? '')}
            placeholder={placeholder}
            className='h-9'
          />

        </Command>
      </div>
    </div>
  )
}
