import { type ColumnDef, flexRender, type Row } from '@tanstack/react-table'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import React, { type MouseEvent } from 'react'

export const GroupedRows = <TData, TValue>({ row, columns, handleOpen, rowRefs }: {
  row: Row<unknown>
  columns: Array<ColumnDef<TData, TValue>>
  handleOpen: (event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, subRow: Row<unknown>) => void
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>
}): JSX.Element => {
  return (
    <React.Fragment key={row.id}>
      <TableRow className='sticky top-0 bg-gray-200'>
        <TableCell colSpan={columns.length} className='pl-6 px-2 py-1 border-b'>
          <div className='flex justify-between items-center flex-wrap'>
            <div className='flex items-center space-x-2'>
              <span className='font-thin text-muted-foreground'>Timme</span>
              <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
                {row.groupingValue as string}
              </span>
            </div>
            <div className='flex items-center space-x-2 px-6'>
              <span className='font-thin text-muted-foreground'>Antal</span>
              <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
                {row.subRows.length}
              </span>
            </div>
          </div>
        </TableCell>
      </TableRow>

      {row.subRows.map((subRow) => (
        <TableRow
          key={subRow.id}
          className='flex items-center cursor-default scroll-mt-10'
          data-state={subRow.getIsSelected() && 'selected'}
          onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, subRow)}
          ref={(el) => {
            if (el) {
              rowRefs.current.set(subRow.id, el)
            } else {
              rowRefs.current.delete(subRow.id)
            }
          }}
        >
          {subRow.getVisibleCells().map((cell) => {
            return (
              <TableCell
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
            )
          })}
        </TableRow>
      ))}
    </React.Fragment>
  )
}
