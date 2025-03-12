import { useTable } from '@/hooks'
import { CommandItem } from '@ttab/elephant-ui'
import { Search } from '@ttab/elephant-ui/icons'

export const TextFilter = (): JSX.Element | null => {
  const { command, table } = useTable()
  const { setPages, setSearch, pages, page } = command


  const globalFilter: unknown = table.getState().globalFilter
  return !page
    ? (
        <CommandItem
          onSelect={() => {
            setPages([...pages, 'query'])
            if (typeof globalFilter === 'string') {
              setSearch(globalFilter)
            }
          }}
        >
          <Search size={18} strokeWidth={1.75} className='mr-2' />
          Fritext
        </CommandItem>
      )
    : null
}
