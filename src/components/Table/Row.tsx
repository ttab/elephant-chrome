import { type MouseEvent, type JSX } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'
import type { DocumentState } from '@ttab/elephant-api/repositorysocket'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires' | 'Factbox' | 'Print' | 'PrintEditor'

export const Row = <TData,>({ row, handleOpen, type, openDocuments }: {
  type: DocumentType
  row: RowType<TData>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, row: RowType<TData>) => void
  openDocuments: string[]
}): JSX.Element => {
  const uuid = (row.original as unknown as DocumentState).document?.uuid
  const selected = !!uuid && openDocuments.includes(uuid)

  return (
    <TableRow
      tabIndex={0}
      data-state={selected && 'selected'}
      className={cn(
        'flex cursor-default scroll-mt-10 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-table-selected data-[state=selected]:bg-table-focused',
        type === 'Assignments' ? 'items-start' : 'items-center'
      )}
      onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, row)}
      ref={(el) => {
        if (el && row.getIsSelected()) {
          el.focus()
        }
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            'first:pl-2 last:pr-2 sm:first:pl-6 sm:last:pr-6',
            cell.column.columnDef.meta?.className
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}
