import { Command } from '@ttab/elephant-ui'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import type { Updater } from '@tanstack/react-table'
import { useTable } from '@/hooks/useTable'

interface FilterProps {
  setGlobalTextFilter?: (updater: Updater<unknown>) => void
  placeholder: string
}

export const SearchBar = ({ placeholder, setGlobalTextFilter }: FilterProps): JSX.Element => {
  const { table } = useTable()
  const { globalFilter } = table.getState() as {
    globalFilter: string
  }

  const handleChange = (value: string | undefined): void => {
    if (value) {
      if (setGlobalTextFilter) {
        setGlobalTextFilter(value)
      }
    } else {
      table.resetGlobalFilter()
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
            onChange={handleChange}
            placeholder={placeholder}
            className='h-9'
          />
        </Command>
      </div>
    </div>
  )
}
