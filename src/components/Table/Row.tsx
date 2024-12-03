import { type MouseEvent } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'

export const Row = ({ row, handleOpen, openDocuments }: {
  row: RowType<unknown>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, subRow: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => {
  return (
    <TableRow
      tabIndex={0}
      className={`flex
        items-center
        cursor-default
        scroll-mt-10
        ml-[2px]
        mr-[3px]
        my-[1px]
        focus:outline-table-selected
        data-[state=selected]:rounded-sm
        data-[state=selected]:bg-table-selected
      `}
      // @ts-expect-error unknown type
      data-state={openDocuments.includes(row.original._id as string) && 'selected'}
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
