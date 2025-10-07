import { Command } from '@ttab/elephant-ui'
import { DebouncedCommandInput } from '@/components/Commands/Menu/DebouncedCommandInput'
import React from 'react'

export const ConceptToolbar = ({ filter, setFilter }: { filter: string, setFilter: React.Dispatch<React.SetStateAction<string>> }): JSX.Element => {
  return (
    <div className='bg-table-bg flex items-center justify-between py-1 px-4 border-b sticky top-0 z-10'>
      <div className='flex flex-1 items-center space-x-2'>
        <Command
          className='[&_[cmdk-input-wrapper]]:border-none'
        >
          <DebouncedCommandInput
            value={filter}
            onChange={(value: string | undefined) => {
              if (value) {
                setFilter(value)
              } else {
                setFilter('')
              }
            }}
            placeholder='Sök concept'
            className='h-9'
          />
        </Command>
      </div>
    </div>
  )
}
