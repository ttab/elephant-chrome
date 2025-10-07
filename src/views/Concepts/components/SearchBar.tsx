import { Command } from '@ttab/elephant-ui'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery } from '@/hooks/useQuery'

export const SearchBar = ({ placeholder }: { placeholder: string }): JSX.Element => {
  const [filter, setFilter] = useQuery(['query'])
  return (
    <div className='bg-table-bg flex items-center justify-between sticky top-0 z-10'>
      <div className='flex flex-1 items-center space-x-2'>
        <Command
          className='[&_[cmdk-input-wrapper]]:border-none'
        >
          <DebouncedCommandInput
            value={filter.query?.[0]}
            onChange={(value: string | undefined) => {
              if (value) {
                setFilter({ query: [value] })
              } else {
                setFilter({})
              }
            }}
            placeholder={`Sök ${placeholder.toLowerCase()}`}
            className='h-9'
          />
        </Command>
      </div>
    </div>
  )
}
