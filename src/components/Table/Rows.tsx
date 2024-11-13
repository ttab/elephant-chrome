import { type MouseEvent } from 'react'
import { flexRender, type Row } from '@tanstack/react-table'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'

export const Rows = ({ row, handleOpen, rowRefs }: {
  row: Row<unknown>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, row: Row<unknown>) => void
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>
}): JSX.Element => {
  return <TableRow
    key={row.id}
    className='flex items-center cursor-default scroll-mt-10'
    data-state={row.getIsSelected() && 'selected'}
    onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, row) }
    ref={(el) => {
      if (el) {
        rowRefs.current.set(row.id, el)
      } else {
        rowRefs.current.delete(row.id)
      }
    }}
        >
    {row.getVisibleCells().map((cell) => {
      return <TableCell
        key={cell.id}
        className={cn(
          'first:pl-2 last:pr-2 sm:first:pl-6 sm:last:pr-6',
          cell.column.columnDef.meta?.className
        )}
              >
        {flexRender(
          cell.column.columnDef.cell,
          cell.getContext()
        )}
      </TableCell>
    })}
  </TableRow>
}
