import {
  type MouseEvent,
  useEffect,
  useCallback,
  useMemo
} from 'react'
import {
  type ColumnDef,
  type Row as RowType
} from '@tanstack/react-table'

import {
  Table as _Table,
  TableBody,
  TableCell,
  TableRow
} from '@ttab/elephant-ui'
import { Toolbar } from './Toolbar'
import { useNavigation, useView, useTable, useHistory, useNavigationKeys, useOpenDocuments } from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import { NewItems } from './NewItems'
import { GroupedRows } from './GroupedRows'
import { LoadingText } from '../LoadingText'
import { Row } from './Row'
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
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId: origin } = useView()
  const { table, loading } = useTable()
  const openDocuments = useOpenDocuments({ idOnly: true })
  const { showModal, hideModal } = useModal()

  const handleOpen = useCallback((event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, row: RowType<unknown>): void => {
    const viewType = type === 'Wires' ? 'Editor' : type

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


  useNavigationKeys({
    keys: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', ' '],
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
        hideModal()
        handleOpen(event, selectedRow)
        return
      }

      if (event.key === ' ' && type === 'Wires') {
        // @ts-expect-error unknown type
        showModal(<Editor id={selectedRow.original._id} />, 'sheet', { id: selectedRow.original._id })
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
    }
  })

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
      ? (
          <GroupedRows<TData, TValue>
            key={index}
            type={type}
            row={row}
            columns={columns}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
          />
        )
      : (
          <Row
            key={index}
            type={type}
            row={row}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
          />
        )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, loading, handleOpen, table, rowSelection])

  return (
    <>
      <Toolbar table={table} />

      {(type === 'Planning' || type === 'Event') && (
        <NewItems.Root>
          <NewItems.Table
            header={`Dina nya skapade ${['Planning', 'Event'].includes(type)
              ? 'planeringar'
              : 'händelser'}`}
            type={type}
          />
        </NewItems.Root>
      )}

      {(type !== 'Search' || !loading) && (
        <_Table className='table-auto relative'>
          <TableBody>
            {TableBodyElement}
          </TableBody>
        </_Table>
      )}
    </>
  )
}
