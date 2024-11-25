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
import { useNavigation, useView, useTable, useHistory, useNavigationKeys } from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import { NewItems } from './NewItems'
import { GroupedRows } from './GroupedRows'
import { Rows } from './Rows'
import { LoadingText } from '../LoadingText'

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
  const { state, dispatch } = useNavigation()
  const history = useHistory()
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
        // @ts-expect-error unknown type
        props: { id: subRow.original._id },
        viewId: crypto.randomUUID(),
        origin,
        history
      })
    }
  }, [dispatch, state.viewRegistry, onRowSelected, origin, type, history])

  const scrollToRow = useCallback((rowId: string) => {
    rowRefs.current.get(rowId)?.scrollIntoView({ behavior: 'auto', block: 'nearest' })
  }, [rowRefs])

  useNavigationKeys({
    keys: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape'],
    onNavigation: (event) => {
      const rows = table.getRowModel().rows
      if (!rows?.length) {
        return
      }

      const selectedRow = table.getGroupedSelectedRowModel()?.flatRows?.[0]
      const currentRows = table.getState().grouping.length
        ? rows.flatMap((row) => [...row.subRows])
        : rows

      if (event.key === 'Enter' && selectedRow) {
        handleOpen(event, selectedRow)
        return
      }

      if (event.key === 'Escape') {
        selectedRow?.toggleSelected(false)
        return
      }

      // ArrowDown and ArrowUp
      const idx = !selectedRow
        ? (event.key === 'ArrowDown' ? 0 : currentRows.length - 1)
        : (selectedRow.index + (event.key === 'ArrowDown' ? 1 : -1) + currentRows.length) % currentRows.length

      currentRows[idx].toggleSelected(true)
      scrollToRow(currentRows[idx].id)
    }
  })

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
            <LoadingText>
              {deferredLoading
                ? isSearchTable
                  ? ''
                  : 'Laddar...'
                : 'Inga resultat hittades'}
            </LoadingText>
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
        <NewItems.Table
          header={`Dina nya skapade ${type === 'Planning'
            ? 'planeringar'
            : 'händelser'}`}
          type={type as 'Planning' | 'Event'}
        />
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
          </>
        )}
    </>
  )
}
