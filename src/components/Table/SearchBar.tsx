import { Command, CommandInput } from '@ttab/elephant-ui'
import type { Updater } from '@tanstack/react-table'
import { useTable } from '@/hooks/useTable'

export const SearchBar = ({ placeholder, setGlobalTextFilter }: {
  setGlobalTextFilter?: (updater: Updater<unknown>) => void
  placeholder: string
}): JSX.Element => {
  const { table } = useTable()
  const { globalFilter } = table.getState() as {
    globalFilter: string
  }
  const handleChange = (value: string | number): void => {
    if (value) {
      if (setGlobalTextFilter) {
        setGlobalTextFilter(value)
      }
    } else if (!value) {
      if (setGlobalTextFilter) {
        setGlobalTextFilter('')
      }
    }
  }
  return (
    <div className='bg-table-bg flex items-center justify-between sticky top-0 z-1 flex-auto'>
      <div className='flex flex-1 items-center space-x-2'>
        <Command
          className='[&_[cmdk-input-wrapper]]:border-none'
        >
          <CommandInput
            value={globalFilter ?? ''}
            onValueChange={(value: string | number) => handleChange(value ?? '')}
            placeholder={placeholder}
          />

        </Command>
      </div>
    </div>
  )
}
