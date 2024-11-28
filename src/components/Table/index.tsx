import {
  type MouseEvent,
  useEffect,
  useCallback,
  useMemo,
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
import { useNavigation, useView, useTable, useHistory } from '@/hooks'
import { isEditableTarget } from '@/lib/isEditableTarget'
import { handleLink } from '@/components/Link/lib/handleLink'
import { NewItems } from './NewItems'
import { GroupedRows } from './GroupedRows'
import { Rows } from './Rows'
import { LoadingText } from '../LoadingText'
import { useModal } from '../Modal/useModal'
import { Editor } from '@/components/PlainEditor'

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
  const history = useHistory()
  const { viewId: origin } = useView()

  const { table, loading } = useTable()

  const { showModal, hideModal } = useModal()

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map())

  const handleOpen = useCallback((event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, row: Row<unknown>): void => {
    const viewType = type === 'Wires' ? 'Editor' : type
    setTimeout(() => {
      row.toggleSelected(!row.getIsSelected())
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
        props: { id: row.original._id },
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

    if (!table || !['ArrowDown', 'ArrowUp', 'Escape', 'Enter', ' '].includes(evt.key)) {
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

      hideModal()
      handleOpen(evt, selectedRow)
      return
    }

    if (evt.key === ' ' && type === 'Wires') {
      // @ts-expect-error unknown type
      showModal(<Editor id={selectedRow.original._id} />, 'sheet')
      return
    }

    if (evt.key === 'Escape') {
      selectedRow?.toggleSelected(false)
      return
    }

    if ((evt.key === 'ArrowDown' || evt.key === 'ArrowUp') && !selectedRow) {
      const idx = evt.key === 'ArrowDown' ? 0 : currentRows.length - 1

      // Set selected row and scroll into view
      currentRows[idx].toggleSelected(true)
      scrollToRow(currentRows[idx].id)
      return
    }

    if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
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

  const rows = table.getRowModel().rows
  const rowSelection = table.getState().rowSelection

  const TableBodyElement = useMemo(() => {
    if (loading || !rows?.length) {
      const isSearchTable = window.location.pathname.includes('/elephant/search')
      return (
        <TableRow>
          <TableCell
            colSpan={columns.length}
            className='h-24 text-center'
          >
            <LoadingText>
              {loading
                ? isSearchTable
                  ? ''
                  : 'Laddar...'
                : 'Inga resultat hittades'}
            </LoadingText>
          </TableCell>
        </TableRow>
      )
    }

    return rows.map((row, index) => (
      table.getState().grouping.length)
      ? <GroupedRows<TData, TValue> key={index} row={row} columns={columns} handleOpen={handleOpen} rowRefs={rowRefs} />
      : <Rows key={index} row={row} handleOpen={handleOpen} rowRefs={rowRefs} />
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, loading, handleOpen, table, rowSelection])

  return (
    <>
      <Toolbar table={table} />
      {(type === 'Planning' || type === 'Event') && (
        <NewItems.Root>
          <NewItems.Table
            header={`Dina nya skapade ${type === 'Planning'
              ? 'planeringar'
              : 'händelser'}`}
            type={type}
          />
        </NewItems.Root>
      )}
      {type === 'Search' && loading
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
