import { type MouseEvent, useEffect, useCallback, useMemo } from 'react'
import {
  type ColumnDef,
  flexRender
} from '@tanstack/react-table'

import { Table as _Table, TableBody, TableCell, TableRow } from '@ttab/elephant-ui'
import { Toolbar } from './Toolbar'
import { useNavigation, useView, useTable } from '@/hooks'
import { isEditableTarget } from '@/lib/isEditableTarget'
import { cn } from '@ttab/elephant-ui/utils'
import { handleLink } from '@/components/Link/lib/handleLink'

interface TableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  type: 'Planning' | 'Event'
  onRowSelected?: (row?: TData) => void
}

export const Table = <TData, TValue>({
  columns,
  type,
  onRowSelected
}: TableProps<TData, TValue>): JSX.Element => {
  const { isActive: isActiveView } = useView()
  const { state, dispatch } = useNavigation()
  const { viewId: origin } = useView()

  const { table, loading } = useTable()

  const keyDownHandler = useCallback((evt: KeyboardEvent): void => {
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
      selectedRow?.toggleSelected(false)
    } else if (!selectedRow) {
      const idx = evt.key === 'ArrowDown' ? 0 : rows.length - 1
      rows[idx].toggleSelected(true)
    } else {
      const nextIdx = selectedRow.index + (evt.key === 'ArrowDown' ? 1 : -1)
      const idx = nextIdx < 0 ? rows.length - 1 : nextIdx >= rows.length ? 0 : nextIdx
      rows[idx].toggleSelected(true)
    }
  }, [table, isActiveView])

  useEffect(() => {
    if (!onRowSelected) {
      return
    }

    document.addEventListener('keydown', keyDownHandler)

    return () => document.removeEventListener('keydown', keyDownHandler)
  }, [keyDownHandler, onRowSelected])

  useEffect(() => {
    if (onRowSelected) {
      const selectedRows = table.getSelectedRowModel()
      // @ts-expect-error unknown type
      onRowSelected(selectedRows?.rows[0]?.original)
    }
  }, [table, onRowSelected])

  const TableBodyElement = useMemo(() => {
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
        key={`calendar/${row.id}`}
        className='cursor-default'
        data-state={row.getIsSelected() && 'selected'}
        onClick={<T extends HTMLElement>(event: MouseEvent<T>) => {
          // @ts-expect-error unknown
          if (!event.nativeEvent.target?.dataset?.rowAction) {
            if (!onRowSelected) {
              return
            }

            handleLink({
              event,
              dispatch,
              viewItem: state.viewRegistry.get(type),
              viewRegistry: state.viewRegistry,
              // @ts-expect-error unknown type
              props: { id: row.original._id },
              viewId: crypto.randomUUID(),
              origin
            })
          }
          setTimeout(() => {
            row.toggleSelected(!row.getIsSelected())
          }, 0)
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
            {flexRender(
              cell.column.columnDef.cell,
              cell.getContext()
            )}
          </TableCell>
        ))}
      </TableRow>
    ))
  }, [table, columns.length, loading, onRowSelected, dispatch, state.viewRegistry, type, origin])

  return (
    <>
      <Toolbar table={table} />
      <div className="rounded-md">
        <_Table className='table-fixed'>
          <TableBody>
            {TableBodyElement}
          </TableBody>
        </_Table>
      </div>
    </>
  )
}

