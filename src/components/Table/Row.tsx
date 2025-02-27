import { type MouseEvent } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'
import type { Wire } from '@/hooks/index/lib/wires'
import { useModal } from '../Modal/useModal'
import { cva } from 'class-variance-authority'
import { useView } from '@/hooks/useView'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires'
export const Row = ({ row, handleOpen, openDocuments, type }: {
  type: DocumentType
  row: RowType<unknown>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, subRow: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => {
  const { currentModal } = useModal()
  const { isActive } = useView()
  const isPriority = (row.original as Wire).fields['document.meta.core_newsvalue.value']?.values[0] === '6'
  const priorityClass = isPriority ? ' text-red-500' : ''

  const variants = cva('',
    {
      variants: {
        status: {
          draft: `border-s-[6px] bg-background ${isActive ? 'data-[state=focused]:ring-2' : ''}`,
          done: `bg-done-background border-s-done border-s-[6px] data-[state=selected]:bg-done ${isActive ? 'data-[state=focused]:bg-done-background data-[state=focused]:ring-2' : ''}${priorityClass}`,
          approved: `bg-approved-background border-s-approved border-s-[6px] data-[state=selected]:bg-approved ${isActive ? 'data-[state=focused]:bg-approved-background data-[state=focused]:ring-2' : ''}${priorityClass}`,
          used: `bg-usable-background border-s-usable border-s-[6px] data-[state=selected]:bg-usable ${isActive ? 'data-[state=focused]:bg-usable-background data-[state=focused]:ring-2' : ''}${priorityClass}`,
          priority: `border-s-[6px] border-s-red-500 bg-background ${isActive ? 'data-[state=focused]:ring-2' : ''}${priorityClass}`
        }
      }
    })

  return (
    <TableRow
      tabIndex={0}
      className={cn('flex cursor-default scroll-mt-10 ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-table-selected data-[state=selected]:bg-table-selected',
        type === 'Assignments' ? 'items-start' : 'items-center',
        variants({
          status: getRowStatus(type, row, isPriority)
        })
      )}
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

function getRowStatus(type: DocumentType, row: RowType<unknown>, isPriority: boolean):
  'draft' | 'done' | 'approved' | 'used' | 'priority' | null {
  if (type !== 'Wires') {
    return null
  }

  const wireRow = row as RowType<Wire>

  const done = Number(wireRow.original?.fields?.['heads.done.version']?.values?.[0]) > -1
    && wireRow.original?.fields?.['heads.done.created']?.values?.[0]
  const approved = Number(wireRow.original?.fields?.['heads.approved.version']?.values?.[0]) > -1
    && wireRow.original?.fields?.['heads.approved.created']?.values?.[0]
  const used = Number(wireRow.original?.fields?.['heads.used.version']?.values?.[0]) > -1
    && wireRow.original?.fields?.['heads.used.created']?.values?.[0]

  if (done || approved || used) {
    return done && (!approved || new Date(done) > new Date(approved))
      ? 'done'
      : approved && (!used || new Date(approved) > new Date(used))
        ? 'approved'
        : 'used'
  }

  if (isPriority) {
    return 'priority'
  }
  return 'draft'
}
