import { type MouseEvent } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'
import type { Wire } from '@/hooks/index/lib/wires'
import { useModal } from '../Modal/useModal'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires'
export const Row = ({ row, handleOpen, openDocuments, type }: {
  type: DocumentType
  row: RowType<unknown>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, subRow: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => {
  const rowDecorators = getRowDecorators(type, row)
  const { currentModal } = useModal()

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
      data-state={((openDocuments.includes(
        ((row.original as { _id: string })?._id) || (row.original as { id: string })?.id)
      && 'selected'))
    || (type === 'Wires' && row.getIsSelected() && 'focused')}
      onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, row)}
      ref={(el) => {
        if (el && row.getIsSelected()) {
          el.focus()

          // When modal is active and a wire view, then change scroll behavior
          if (currentModal?.id && type === 'Wires') {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
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

  const done = Number(wireRow.original?.fields?.['heads.done.version']?.values?.[0]) > -1
    && wireRow.original?.fields?.['heads.done.created']?.values?.[0]
  const approved = Number(wireRow.original?.fields?.['heads.approved.version']?.values?.[0]) > -1
    && wireRow.original?.fields?.['heads.approved.created']?.values?.[0]


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
