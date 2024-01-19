import React, { useEffect } from 'react'
import {
  type ColumnDef,
  flexRender
} from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'
import { Toolbar } from './Toolbar'
import { useView } from '@/hooks'
import { isEditableTarget } from '@/lib/isEditableTarget'
import { useTable } from '@/hooks/useTable'
import { columns } from './Columns'

interface PlanningTableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  data: TData[]
  onRowSelected?: (row?: TData) => void
}


export const PlanningTable = <TData, TValue>({
  onRowSelected
}: PlanningTableProps<TData, TValue>): JSX.Element => {
  const { isActive: isActiveView } = useView()

  const { table, loading } = useTable()

  // Handle navigation using arrow keys
  useEffect(() => {
    if (!onRowSelected) {
      return
    }

    const keyDownHandler = (evt: KeyboardEvent): void => {
      if (!isActiveView || isEditableTarget(evt)) {
        return
      }

      if (!table || !['ArrowDown', 'ArrowUp', 'Escape'].includes(evt.key)) {
        return
      }

      evt.preventDefault()
      const rows = table.getRowModel().rows
      if (!rows?.length) {
        return
      }

      const selectedRows = table.getSelectedRowModel()
      const selectedRow = selectedRows?.rows[0]

      if (evt.key === 'Escape') {
        if (selectedRow) {
          selectedRow.toggleSelected(false)
        }
      } else if (!selectedRow) {
        const idx = evt.key === 'ArrowDown' ? 0 : rows.length - 1
        rows[idx].toggleSelected(true)
      } else {
        const nextIdx = selectedRow.index + ((evt.key === 'ArrowDown') ? 1 : -1)
        const idx = nextIdx < 0 ? rows.length - 1 : nextIdx >= rows.length ? 0 : nextIdx
        rows[idx].toggleSelected(true)
      }
    }

    document.addEventListener('keydown', keyDownHandler)

    return () => document.removeEventListener('keydown', keyDownHandler)
  }, [table, isActiveView, onRowSelected])

  // When row selection changes, report back to callback
  useEffect(() => {
    if (onRowSelected) {
      const selectedRows = table.getSelectedRowModel()
      // @ts-expect-error unknown type
      onRowSelected(selectedRows?.rows[0]?.original)
    }
  }, [table, onRowSelected])

  const TableBodyElement = (): React.ReactNode => {
    if (table.getRowModel().rows?.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="h-24 text-center"
          >
            {loading ? 'Loading...' : 'No results.'}
          </TableCell>
        </TableRow>
      )
    }

    return table.getRowModel().rows.map((row) => (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() && 'selected'}
        onClick={(event) => {
          if (!onRowSelected) {
            return
          }

          event.preventDefault()
          row.toggleSelected(!row.getIsSelected())
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell
            key={cell.id}
            className={cell.column.columnDef.meta?.className}
          >
            {flexRender(
              cell.column.columnDef.cell,
              cell.getContext()
            )}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  return (
    <div className="space-y-2">
      <Toolbar table={table} />
      <div className="rounded-md">
        <Table>
          <TableBody>
            <TableBodyElement />
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
