import { type MouseEvent } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'

export const Row = ({ row, handleOpen, openDocuments, type }: {
  type: 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires'
  row: RowType<unknown>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, subRow: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => (
  <TableRow
    tabIndex={0}
    className={`flex
        items-center
        cursor-default
        scroll-mt-10
        ring-inset
        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-table-selected
        data-[state=selected]:bg-table-selected
      `}
    data-state={((openDocuments.includes((row.original as { _id: string })?._id) && 'selected'))
    || (type === 'Wires' && row.getIsSelected() && 'focused')}
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
