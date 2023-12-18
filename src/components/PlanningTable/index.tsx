import React, { useEffect, useState } from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'
import { Pagination } from './Pagination'
import { Toolbar } from './Toolbar'
import { useView } from '@/hooks'

interface PlanningTableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  data: TData[]
  onRowSelected?: (row?: TData) => void
}


export const PlanningTable = <TData, TValue>({
  columns,
  data,
  onRowSelected
}: PlanningTableProps<TData, TValue>): JSX.Element => {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const { isActiveView } = useView()

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters
    },
    enableRowSelection: true,
    enableMultiRowSelection: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues()
  })

  // Handle navigation using arrow keys
  useEffect(() => {
    if (!onRowSelected) {
      return
    }

    const keyDownHandler = (evt: KeyboardEvent): void => {
      if (!isActiveView) {
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
      onRowSelected(selectedRows?.rows[0]?.original)
    }
  }, [table, rowSelection, onRowSelected])


  const TableBodyElement = (): React.ReactNode => {
    if (table.getRowModel().rows?.length === 0) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className="h-24 text-center"
          >
            No results.
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
          <TableCell key={cell.id}>
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
      <Pagination table={table} />
    </div>
  )
}
