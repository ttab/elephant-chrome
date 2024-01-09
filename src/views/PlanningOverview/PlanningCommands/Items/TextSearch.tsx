import { type Table } from '@tanstack/react-table'
import { CommandItem } from '@ttab/elephant-ui'
import { Search } from '@ttab/elephant-ui/icons'
import { type Dispatch } from 'react'
import { type Planning } from '../../PlanningTable/data/schema'

interface TextFilterProps {
  pages: string[]
  setPages: Dispatch<string[]>
  page: string
  setSearch: Dispatch<string>
  table: Table<Planning>
}
export const TextFilter = ({ pages, setPages, page, setSearch, table }: TextFilterProps): JSX.Element | null => {
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
