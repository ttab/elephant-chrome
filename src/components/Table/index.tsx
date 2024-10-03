import React, { type MouseEvent, useEffect, useCallback, useMemo, useDeferredValue } from 'react'
import {
  type ColumnDef,
  flexRender
} from '@tanstack/react-table'

import {
  Table as _Table,
  TableBody,
  TableCell,
  TableRow
} from '@ttab/elephant-ui'
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

  // Needed for the useMemo to refresh when new data is set in the table
  // Defer to previous table untill ready
  const deferredRows = useDeferredValue(table.getRowModel().rows)

  const TableBodyElement = useMemo(() => {
    if (loading || !deferredRows?.length) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className='h-24 text-center'
          >
            {loading ? 'Laddar...' : 'Inga planeringar funna.'}
          </TableCell>
        </TableRow>
      )
    }

    return deferredRows.map((row) => {
      return (
        <React.Fragment key={row.id}>
          <TableRow className='sticky top-0 bg-gray-100 border-b-2'>
            <TableCell colSpan={columns.length - 1} className='pl-6 space-x-2 items-baseline'>
              <span className='font-thin text-gray-500'>Nyhetsvärde</span>
              <span className='inline-flex items-center justify-center w-6 h-6 bg-white text-gray-800 rounded-full ring-1 ring-gray-300 shadow-md'>
                {row.groupingValue as string}
              </span>
            </TableCell>
            <TableCell colSpan={1} className='px-6 flex flex-row space-x-2 items-baseline'>
              <span className='font-thin text-gray-500'>Antal</span>
              <span className='inline-flex items-center justify-center w-6 h-6 bg-white text-gray-800 rounded-full ring-1 ring-gray-300 shadow-md'>
                {row.subRows.length}
              </span>
            </TableCell>
          </TableRow>
          {row.subRows.map((subRow) => (
            <TableRow
              key={subRow.id}
              className='cursor-default'
              data-state={subRow.getIsSelected() && 'selected'}
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
                    props: { id: subRow.original._id },
                    viewId: crypto.randomUUID(),
                    origin
                  })
                }
                setTimeout(() => {
                  subRow.toggleSelected(!subRow.getIsSelected())
                }, 0)
              }}
              >
              {subRow.getVisibleCells().map((cell) => {
                return <TableCell
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
              })}
            </TableRow>
          ))}
        </React.Fragment>
      )
    })
  }, [deferredRows, columns.length, onRowSelected, dispatch, state.viewRegistry, type, origin])


  return (
    <div className='h-screen w-screen'>
      <Toolbar table={table} />
      <_Table className='table-auto w-full relative'>

        <TableBody className='table-auto w-full relative'>
          {TableBodyElement}
        </TableBody>
      </_Table>
    </div>
  )
}
