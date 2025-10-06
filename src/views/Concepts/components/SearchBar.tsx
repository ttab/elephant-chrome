import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery } from '@/hooks/useQuery'
import type { Updater } from '@tanstack/react-table'
import { Command } from '@ttab/elephant-ui'
import type { Dispatch, SetStateAction } from 'react'

interface SearchbarProps {
  placeholder: string
  page: string
  search: string | undefined
  setSearch: Dispatch<SetStateAction<string | undefined>>
  setGlobalTextFilter?: (updater: Updater<unknown>) => void
}

export const Searchbar = ({ search, setSearch, setGlobalTextFilter, page, placeholder }: SearchbarProps) => {
  const [filter, setFilter] = useQuery(['query'])

  console.log(page)
  const handleInputChange = (value: string | undefined) => {
    if (value) {
      if (setGlobalTextFilter) {
        setGlobalTextFilter(value)
      } else {
        setFilter({ query: [value] })
      }
    }
  }

  return (
    <div className='flex flex-1 items-center space-x-2'>
      <Command
        className='[&_[cmdk-input-wrapper]]:border-none'
      >
        <DebouncedCommandInput
          value={page === 'query' ? filter?.query?.[0] : search}
          onChange={(value) => handleInputChange(value)}
          placeholder={`Sök ${placeholder ? placeholder : 'Concept'}`}
          className='h-9'
        />
      </Command>
    </div>
  )
}

