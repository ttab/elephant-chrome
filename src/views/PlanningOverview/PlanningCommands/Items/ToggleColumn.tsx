import { useTable } from '@/hooks'
import { CommandItem, CommandList } from '@ttab/elephant-ui'
import { CheckIcon, SlidersHorizontal } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'

export const ToggleColumn = (): JSX.Element | null => {
  const { command, table } = useTable()
  const { setPages, setSearch, pages, page } = command

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
