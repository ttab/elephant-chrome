import { Command } from '@ttab/elephant-ui'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import { useQuery } from '@/hooks/useQuery'
import type { JSX } from 'react'
import { QuickFilter } from '@/components/Table/QuickFilter'

export const Toolbar = (): JSX.Element => {
  const [filter, setFilter] = useQuery(['query'])

  return (
    <div className='bg-background flex items-center justify-between py-1 px-4 border-b sticky top-0 z-10'>
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
            placeholder='Fritextsökning'
            className='h-9'
          />
        </Command>
      </div>
      <QuickFilter />
    </div>
  )
}
