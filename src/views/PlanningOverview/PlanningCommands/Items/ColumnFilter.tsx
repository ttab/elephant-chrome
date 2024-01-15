import { CommandItem } from '@ttab/elephant-ui'
import { type ReactNode } from 'react'
import { FacetedFilter } from '../FacetedFilter'
import { FileQuestion } from '@ttab/elephant-ui/icons'
import { useTable } from '@/hooks'

export const ColumnFilter = (): ReactNode => {
  const { command, table } = useTable()
  const { setPages, setSearch, pages, page } = command

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
            {column.columnDef.meta?.columnIcon
              ? <column.columnDef.meta.columnIcon className='h-4 w-4 mr-2'/>
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

