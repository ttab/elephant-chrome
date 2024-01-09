import { type Table } from '@tanstack/react-table'
import { type Planning } from '../../PlanningTable/data/schema'
import { CommandItem, CommandList } from '@ttab/elephant-ui'
import { CheckIcon, SlidersHorizontal } from '@ttab/elephant-ui/icons'
import { type Dispatch } from 'react'
import { cn } from '@ttab/elephant-ui/utils'

interface ToggleColumnProps {
  table: Table<Planning>
  page: string
  pages: string[]
  setPages: Dispatch<string[]>
  setSearch: Dispatch<string>
}
export const ToggleColumn = ({ table, page, pages, setPages, setSearch }: ToggleColumnProps): JSX.Element | null => {
  if (!page) {
    return (
      <CommandItem
        onSelect={() => {
          setPages([...pages, 'toggleColumns'])
          setSearch('')
        }}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Toggle columns
      </CommandItem>
    )
  }

  if (page === 'toggleColumns') {
    return (
      <CommandList>
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            const isSelected = column.getIsVisible()
            return (
              <CommandItem
                key={column.id}
                onSelect={() => column.toggleVisibility(!isSelected)}
            >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
              >
                  <CheckIcon className={cn('h-4 w-4')} />
                </div>

                <span className='capitalize'>{column.id}</span>
              </CommandItem>
            )
          })}
      </CommandList>
    )
  }
  return null
}
