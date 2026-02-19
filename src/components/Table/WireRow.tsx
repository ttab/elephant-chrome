import type { JSX } from 'react'
import { type MouseEvent } from 'react'
import { TableRow, TableCell } from '@ttab/elephant-ui'
import { type Row as RowType, flexRender } from '@tanstack/react-table'
import { cn } from '@ttab/elephant-ui/utils'
import type { Wire } from '@/shared/schemas/wire'
import { cva } from 'class-variance-authority'
import { getWireStatus } from '../../lib/getWireStatus'

type DocumentType = 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires' | 'Factbox' | 'Print' | 'PrintEditor' | 'Editor'

export const WireRow = <TData, >({ row, handleOpen, openDocuments, type }: {
  type: DocumentType
  row: RowType<TData>
  handleOpen: (event: MouseEvent<HTMLTableRowElement>, row: RowType<TData>) => void
  openDocuments: string[]
}): JSX.Element => {
  const wire = row.original as Wire
  const wireRow = row as unknown as RowType<Wire>

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
        variants({ status: getWireStatus(wire) })
      )}
      data-state={getDataState(openDocuments, wire, type, wireRow)}
      onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, row)}
      ref={(el) => handleRef(el, wireRow)}
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

function handleRef<T extends Wire>(el: HTMLTableRowElement | null, row: RowType<T>): void {
  if (el && row.getIsSelected()) {
    el.focus()
  }
}
