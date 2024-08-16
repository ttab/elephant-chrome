import { CommandItem } from '@ttab/elephant-ui'
import { type ReactNode } from 'react'
import { FileQuestion } from '@ttab/elephant-ui/icons'
import { useTable } from '@/hooks'

export const ColumnFilter = (): ReactNode => {
  const { command, table } = useTable()
  const { setPages, setSearch, pages, page } = command

  const columns = table.getAllColumns()

  if (!page) {
    return columns.map((column) => {
      return column.columnDef.meta?.Filter
        ? (
          <CommandItem
            key={column.id}
            value={column.id}
            onSelect={() => {
              setPages([...pages, column.id])
              setSearch('')
            }}
            >
            {column.columnDef.meta?.columnIcon
              ? <column.columnDef.meta.columnIcon size={18} strokeWidth={1.75} className='mr-2' />
              : <FileQuestion size={18} strokeWidth={1.75} className='mr-2' />
              }
            {column.columnDef.meta?.name || 'unknown'}
          </CommandItem>)
        : null
    }).filter(x => x)
  }

  if (page === 'textFilter') {
    return <></>
  }

  const column = table.getColumn(page)

  if (column?.columnDef?.meta?.Filter) {
    return column.columnDef.meta?.Filter({ column, setSearch })
  }

  return null
}

