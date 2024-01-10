import { useTable } from '@/hooks'
import { CommandItem } from '@ttab/elephant-ui'
import { Search } from '@ttab/elephant-ui/icons'

export const TextFilter = (): JSX.Element | null => {
  const { command, table } = useTable()
  const { setPages, setSearch, pages, page } = command

  return !page
    ? (
      <CommandItem
        onSelect={() => {
          setPages([...pages, 'textFilter'])
          setSearch(table.getState().globalFilter)
        }}>
        <Search className='h-4 w-4 mr-2'/>
        Text filter
      </CommandItem>
      )
    : null
}
