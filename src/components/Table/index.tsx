import React, {
  type MouseEvent,
  useEffect,
  useCallback,
  useMemo,
  useDeferredValue,
  useRef
} from 'react'
import {
  type ColumnDef,
  flexRender,
  type Row
} from '@tanstack/react-table'

import {
  Table as _Table,
  TableBody,
  TableCell,
  TableRow
} from '@ttab/elephant-ui'
import { Toolbar } from './Toolbar'
import { useNavigation, useView, useTable, useHistory } from '@/hooks'
import { isEditableTarget } from '@/lib/isEditableTarget'
import { cn } from '@ttab/elephant-ui/utils'
import { handleLink } from '@/components/Link/lib/handleLink'
import { NewItems } from './NewItems'

interface TableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  type: 'Planning' | 'Event' | 'Assignments'
  onRowSelected?: (row?: TData) => void
}

export const Table = <TData, TValue>({
  columns,
  type,
  onRowSelected
}: TableProps<TData, TValue>): JSX.Element => {
  const { isActive: isActiveView } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId: origin } = useView()

  const { table, loading } = useTable()

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())

  const handleOpen = useCallback((event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, subRow: Row<unknown>): void => {
    setTimeout(() => {
      subRow.toggleSelected(!subRow.getIsSelected())
    }, 0)

    const target = event.target as HTMLElement
    if (target && 'dataset' in target && !target.dataset.rowAction) {
      if (!onRowSelected) {
        return
      }

      handleLink({
        event,
        dispatch,
        viewItem: state.viewRegistry.get(type),
        // @ts-expect-error unknown type
        props: { id: subRow.original._id },
        viewId: crypto.randomUUID(),
        origin,
        history
      })
    }
  }, [dispatch, state.viewRegistry, onRowSelected, origin, type, history])

  const scrollToRow = useCallback((rowId: string) => {
    rowRefs.current.get(rowId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [rowRefs])

  // TODO: We should extend useNavigationKeys hook to accomodate this functionality
  // TODO: We should then remove isEditableTarget as it is built into useNavigationKeys
  const keyDownHandler = useCallback((evt: KeyboardEvent): void => {
    if (!isActiveView || isEditableTarget(evt)) {
      return
    }

    if (!table || !['ArrowDown', 'ArrowUp', 'Escape', 'Enter'].includes(evt.key)) {
      return
    }

    evt.preventDefault()
    const rows = table.getRowModel().rows
    if (!rows?.length) {
      return
    }

    const selectedRows = table.getGroupedSelectedRowModel()
    const selectedRow = selectedRows?.flatRows[0]

    const subRows = rows.flatMap(row => [...row.subRows])

    if (evt.key === 'Enter') {
      if (!selectedRow) return

      handleOpen(evt, selectedRow)
    }

    if (evt.key === 'Escape') {
      selectedRow?.toggleSelected(false)
    } else if (!selectedRow) {
      const idx = evt.key === 'ArrowDown' ? 0 : subRows.length - 1

      // Set selected row and scroll into view
      subRows[idx].toggleSelected(true)
      scrollToRow(subRows[idx].id)
    } else {
      // Get next row
      const nextIdx = selectedRow.index + (evt.key === 'ArrowDown' ? 1 : -1)
      const idx = nextIdx < 0 ? subRows.length - 1 : nextIdx >= subRows.length ? 0 : nextIdx

      // Set selected row and scroll into view
      subRows[idx].toggleSelected(true)
      scrollToRow(subRows[idx].id)
    }
  }, [table, isActiveView, handleOpen, scrollToRow])

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
  // Defer to previous table and loading state until ready, reduces flickering
  const deferredRows = useDeferredValue(table.getRowModel().rows)
  const deferredLoading = useDeferredValue(loading)

  const TableBodyElement = useMemo(() => {
    if (deferredLoading || !deferredRows?.length) {
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className='h-24 text-center'
          >
            {deferredLoading
              ? 'Laddar...'
              : 'Inga planeringar funna.'
            }
          </TableCell>
        </TableRow>
      )
    }

    return deferredRows.map((row) => {
      return (
        <React.Fragment key={row.id}>
          <TableRow className='sticky top-0 bg-muted'>
            <TableCell colSpan={columns.length} className='pl-6 px-2 py-1 border-b'>
              <div className='flex justify-between items-center flex-wrap'>
                <div className='flex items-center space-x-2'>
                  <span className='font-thin text-muted-foreground'>Nyhetsvärde</span>
                  <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
                    {row.groupingValue as string}
                  </span>
                </div>
                <div className='flex items-center space-x-2 px-6'>
                  <span className='font-thin text-muted-foreground'>Antal</span>
                  <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
                    {row.subRows.length}
                  </span>
                </div>
              </div>
            </TableCell>
          </TableRow>

          {row.subRows.map((subRow) => (
            <TableRow
              key={subRow.id}
              className='flex items-center cursor-default scroll-mt-10'
              data-state={subRow.getIsSelected() && 'selected'}
              onClick={(event: MouseEvent<HTMLTableRowElement>) => handleOpen(event, subRow)}
              ref={(el) => {
                if (el) {
                  rowRefs.current.set(subRow.id, el)
                } else {
                  rowRefs.current.delete(subRow.id)
                }
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
  }, [deferredRows, columns.length, deferredLoading, handleOpen])


  return (
    <>
      <Toolbar table={table} />
      <NewItems.Root>
        <NewItems.Table header={`Dina nya skapade ${type === 'Planning' ? 'planeringar' : 'händelser'}`} type={type} />
      </NewItems.Root>
      <_Table className='table-auto relative'>
        <TableBody>
          {TableBodyElement}
        </TableBody>
      </_Table>
    </>
  )
}
