import { useTable } from '@/hooks'
import { CommandItem } from '@ttab/elephant-ui'
import { Search } from '@ttab/elephant-ui/icons'

export const TextFilter = (): JSX.Element | null => {
  const { command, table } = useTable()
  const { setPages, setSearch, pages, page } = command

  const globalFilter: string | undefined = typeof table.getState().globalFilter === 'string'
    ? table.getState().globalFilter
    : undefined

  return !page
    ? (
        <CommandItem
          onSelect={() => {
            setPages([...pages, 'textFilter'])
            setSearch(globalFilter)
          }}
        >
          <Search size={18} strokeWidth={1.75} className='mr-2' />
          Text
        </CommandItem>
      )
    : null
}
