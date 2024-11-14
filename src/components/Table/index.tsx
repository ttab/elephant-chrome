import {
  type MouseEvent,
  useEffect,
  useCallback,
  useMemo,
  useDeferredValue,
  useRef
} from 'react'
import {
  type ColumnDef,
  type Row
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
import { handleLink } from '@/components/Link/lib/handleLink'
import { NewItems } from './NewItems'
import { GroupedRows } from './GroupedRows'
import { Rows } from './Rows'
import { Pagination } from './Pagination'

interface TableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  type: 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires'
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

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())

  const handleOpen = useCallback((event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, subRow: Row<unknown>): void => {
    const viewType = type === 'Wires' ? 'Editor' : type
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
        viewItem: state.viewRegistry.get(viewType),
        viewRegistry: state.viewRegistry,
        // @ts-expect-error unknown type
        props: { id: subRow.original._id },
        viewId: crypto.randomUUID(),
        origin
      })
    }
  }, [dispatch, state.viewRegistry, onRowSelected, origin, type])

  const scrollToRow = useCallback((rowId: string) => {
    rowRefs.current.get(rowId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [rowRefs])

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

    const currentRows = table.getState().grouping.length
      ? rows.flatMap((row) => [...row.subRows])
      : rows

    if (evt.key === 'Enter') {
      if (!selectedRow) return

      handleOpen(evt, selectedRow)
    }

    if (evt.key === 'Escape') {
      selectedRow?.toggleSelected(false)
    } else if (!selectedRow) {
      const idx = evt.key === 'ArrowDown' ? 0 : currentRows.length - 1

      // Set selected row and scroll into view
      currentRows[idx].toggleSelected(true)
      scrollToRow(currentRows[idx].id)
    } else {
      // Get next row
      const nextIdx = selectedRow.index + (evt.key === 'ArrowDown' ? 1 : -1)
      const idx = nextIdx < 0 ? currentRows.length - 1 : nextIdx >= currentRows.length ? 0 : nextIdx

      // Set selected row and scroll into view
      currentRows[idx].toggleSelected(true)
      scrollToRow(currentRows[idx].id)
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

  const rowSelection = table.getState().rowSelection

  const TableBodyElement = useMemo(() => {
    if (deferredLoading || !deferredRows?.length) {
      const isSearchTable = window.location.pathname.includes('/elephant/search')
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className='h-24 text-center'
          >
            {deferredLoading
              ? isSearchTable
                ? ''
                : 'Laddar...'
              : 'Inga poster funna.'}
          </TableCell>
        </TableRow>
      )
    }

    return deferredRows.map((row, index) => (
      table.getState().grouping.length)
      ? <GroupedRows<TData, TValue> key={index} row={row} columns={columns} handleOpen={handleOpen} rowRefs={rowRefs} />
      : <Rows key={index} row={row} handleOpen={handleOpen} rowRefs={rowRefs} />
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredRows, columns, deferredLoading, handleOpen, table, rowSelection])

  return (
    <>
      <Toolbar table={table} />
      <NewItems.Root>
        <NewItems.Table header={`Dina nya skapade ${type === 'Planning' ? 'planeringar' : 'händelser'}`} type={type} />
      </NewItems.Root>
      {type === 'Search' && deferredLoading
        ? null
        : (
            <>
              <_Table className='table-auto relative'>
                <TableBody>
                  {TableBodyElement}
                </TableBody>
              </_Table>
              <Pagination />
            </>
          )}
    </>
  )
}
