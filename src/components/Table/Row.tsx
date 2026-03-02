import { type MouseEvent, type JSX, useCallback } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'
import type { TableRowData } from './types'

export const Row = <TData extends TableRowData,>({ row, handleOpen, openDocuments, align = 'center' }: {
  row: RowType<TData>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, row: RowType<TData>) => void
  openDocuments: string[]
  align?: 'start' | 'center'
}): JSX.Element => {
  const uuid = row.original.id
  const selected = !!uuid && openDocuments.includes(uuid)
  const isSelected = row.getIsSelected()

  const rowRef = useCallback((el: HTMLTableRowElement | null) => {
    if (el && isSelected) {
      el.focus()
    }
  }, [isSelected])

  return (
    <TableRow
      tabIndex={0}
      data-state={selected && 'selected'}
      className={cn(
        'flex cursor-default scroll-mt-10 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-table-selected data-[state=selected]:bg-table-focused',
        align === 'start' ? 'items-start' : 'items-center'
      )}
      onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, row)}
      ref={rowRef}
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
