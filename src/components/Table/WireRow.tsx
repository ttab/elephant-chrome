
import { type MouseEvent } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'
import type { Wire } from '@/hooks/index/lib/wires'
import { useModal } from '../Modal/useModal'
import { cva } from 'class-variance-authority'
import type { ModalData } from '../Modal/ModalContext'
import { getWireStatus } from './lib/getWireStatus'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires' | 'Factbox' | 'PrintArticles' | 'PrintEditor'

export const WireRow = ({ row, handleOpen, openDocuments, type }: {
  type: DocumentType
  row: RowType<unknown>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, row: RowType<unknown>) => void
  openDocuments: string[]
}): JSX.Element => {
  const { currentModal } = useModal()
  const wire = row.original as Wire
  const wireRow = row as RowType<Wire>

  const isFlash = !!wire.fields?.['heads.flash.version']?.values?.[0]
    || wire.fields['document.meta.core_newsvalue.value']?.values[0] === '6'
  const flashClass = isFlash ? 'text-red-500' : ''
  const flashClassDraft = isFlash ? 'bg-background border-s-[6px] border-s-red-500 text-red-500' : ''

  const variants = cva('', {
    variants: {
      status: {
        draft: `border-s-[6px] bg-background ${flashClassDraft}`,
        read: getStatusClass('approved', wire, flashClass),
        saved: getStatusClass('done', wire, flashClass),
        used: getStatusClass('usable', wire, flashClass)
      }
    }
  })

  return (
    <TableRow
      tabIndex={0}
      className={cn(
        'flex cursor-default scroll-mt-[70px] ring-inset focus:outline-none focus-visible:ring-2 focus-visible:ring-table-selected data-[state=selected]:bg-table-selected',
        variants({ status: getWireStatus(type, wire) })
      )}
      data-state={getDataState(openDocuments, wire, type, wireRow)}
      onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, row)}
      ref={(el) => handleRef(el, wireRow, currentModal, type)}
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

function getStatusClass(status: 'done' | 'approved' | 'usable', wire: Wire, flashClass: string): string {
  const isWireUpdated = isUpdated(wire)
  const base = `${!isWireUpdated ? `bg-${status}-background` : ''} border-s-${status} border-s-[6px]`
  return `${base} ${flashClass}`
}

function isUpdated(wire: Wire): boolean {
  const currentVersion = parseInt(wire.fields['current_version']?.values[0], 10)
  const versions = [
    parseInt(wire.fields['heads.saved.version']?.values[0], 10),
    parseInt(wire.fields['heads.read.version']?.values[0], 10),
    parseInt(wire.fields['heads.used.version']?.values[0], 10)
  ]

  return versions.some((version) => {
    const parsedVersion = isNaN(version) || version < 0 ? NaN : version
    return currentVersion > parsedVersion
  })
}

function getDataState(openDocuments: string[], wire: Wire, type: DocumentType, row: RowType<Wire>): 'focused' | 'selected' | undefined {
  return ((openDocuments.includes(wire.id) && 'selected') || (type === 'Wires' && row.getIsSelected() && 'focused')) || undefined
}

function handleRef(el: HTMLTableRowElement | null, row: RowType<Wire>, currentModal: ModalData | undefined, type: DocumentType): void {
  if (el && row.getIsSelected()) {
    el.focus()

    // When modal is active and a wire view, then change scroll behavior
    if (currentModal?.id && type === 'Wires') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}
