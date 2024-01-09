import { CommandItem } from '@ttab/elephant-ui'
import { type Table } from '@tanstack/react-table'
import { type ReactNode, type Dispatch } from 'react'
import { type Planning } from '../../PlanningTable/data/schema'
import { FacetedFilter } from '../FacetedFilter'
import { FileQuestion } from '@ttab/elephant-ui/icons'

interface ColumnFilterProps {
  table: Table<Planning>
  page: string
  pages: string[]
  setPages: Dispatch<string[]>
  setSearch: Dispatch<string>
}
export const ColumnFilter = ({ table, page, pages, setPages, setSearch }: ColumnFilterProps): ReactNode => {
  const columns = table.getAllColumns()

  if (!page) {
    return columns.map((column) => {
      return column.columnDef.meta?.filter
        ? (
          <CommandItem
            key={column.id}
            value={column.id}
            onSelect={() => {
              setPages([...pages, `faceted-${column.id}`])
              setSearch('')
            }}
            >
            {column.columnDef.meta?.icon
              ? <column.columnDef.meta.icon className='h-4 w-4 mr-2'/>
              : <FileQuestion className='h4 w-4 mr-2'/>
              }
            {column.columnDef.meta?.name || 'unknown'}
          </CommandItem>)
        : null
    }).filter(x => x)
  }

  if (page.startsWith('faceted-')) {
    return <FacetedFilter column={table.getColumn(page.replace('faceted-', ''))} setSearch={setSearch}/>
  }
  return null
}

