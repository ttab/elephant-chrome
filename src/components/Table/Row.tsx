import { type MouseEvent } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'
import type { Wire } from '@/lib/index/schemas/wire'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires'
export const Row = ({ row, handleOpen, openDocuments, type }: {
  type: DocumentType
  row: RowType<unknown>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, subRow: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => {
  const rowDecorators = getRowDecorators(type, row)
  return (
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
        ${rowDecorators}
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
}

function getRowDecorators(type: DocumentType, row: RowType<unknown>): string {
  if (type !== 'Wires') {
    return ''
  }

  const wireRow = row as RowType<Wire>

  const done = wireRow.original?._source?.['heads.done.version']?.[0] > -1
    && wireRow.original?._source?.['heads.done.created']?.[0]
  const approved = wireRow.original?._source?.['heads.approved.version']?.[0] > -1
    && wireRow.original?._source?.['heads.approved.created']?.[0]


  if (done || approved) {
    return done && (!approved || new Date(done) > new Date(approved))
      ? `bg-done-background
      data-[state=selected]:bg-done
      focus-visible:bg-done-background
      data-[state=focused]:bg-done-border`
      : `bg-approved-background
      data-[state=selected]:bg-approved
      focus-visible:bg-approved-background
      data-[state=focused]:bg-approved-border`
  }

  return ''
}
