import type {
  PropsWithChildren
} from 'react'
import {
  type MouseEvent,
  useEffect,
  useCallback,
  useMemo,
  type JSX
} from 'react'
import {
  type ColumnDef,
  type Row as RowType
} from '@tanstack/react-table'

import {
  Table as _Table,
  TableBody
} from '@ttab/elephant-ui'
import {
  useNavigation,
  useView,
  useTable,
  useHistory,
  useNavigationKeys,
  useOpenDocuments
} from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import { Row } from './Row'
import { useModal } from '../Modal/useModal'
import { GroupedRows } from './GroupedRows'
import type { TableRowData, NavigationParams } from './types'
import type { NavigationKey } from '@/hooks/useNavigationKeys'

const NAVIGATION_KEYS: NavigationKey[] = ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', ' ']

interface TableProps<TData extends TableRowData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  onRowSelected?: (row?: TData) => void
  resolveNavigation?: (row: TData) => NavigationParams
  rowAlign?: 'start' | 'center'
}

export const Table = <TData extends TableRowData, TValue>({
  columns,
  onRowSelected,
  resolveNavigation,
  rowAlign,
  children
}: TableProps<TData, TValue> & PropsWithChildren): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId: origin } = useView()
  const { table } = useTable<TData>()
  const openDocuments = useOpenDocuments({ idOnly: true })
  const { hideModal, currentModal } = useModal()

  const availableRows = table.getRowModel().rows
  const groupingLength = table.getState().grouping.length

  const { navigableRows, rowIndexMap } = useMemo(() => {
    const hasGrouping = groupingLength > 0
    const rows = hasGrouping
      ? availableRows.flatMap((row) =>
        row.subRows && row.subRows.length > 0 ? row.subRows : []
      )
      : availableRows

    // Create O(1) lookup map: row.id -> index
    const indexMap = new Map<string, number>()
    rows.forEach((row, index) => {
      indexMap.set(row.id, index)
    })

    return {
      navigableRows: rows,
      rowIndexMap: indexMap
    }
  }, [availableRows, groupingLength])

  const handleOpen = useCallback((event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, row: RowType<TData>): void => {
    const target = event.target as HTMLElement
    if (target && 'dataset' in target && !target.dataset.rowAction) {
      if (!onRowSelected && !resolveNavigation) {
        return
      }

      // Strip __updater metadata before navigation. Ie mark as "read"
      if ('__updater' in row.original) {
        delete (row.original as Record<string, unknown>).__updater
      }

      const navParams = resolveNavigation
        ? resolveNavigation(row.original)
        : { id: row.original.id }

      handleLink({
        event,
        dispatch,
        viewItem: state.viewRegistry.get(navParams.opensWith || 'Error'),
        props: { id: navParams.id, version: navParams.version },
        viewId: crypto.randomUUID(),
        origin,
        history,
        keepFocus: (event as KeyboardEvent)?.key === ' ',
        ...(navParams.version && {
          readOnly: {
            version: BigInt(navParams.version)
          }
        })
      })
    }
  }, [dispatch, state.viewRegistry, onRowSelected, origin, history, resolveNavigation])

  const handleNavigation = useCallback((event: KeyboardEvent): void => {
    if (!navigableRows?.length) {
      return
    }

    const selectedRow = table.getGroupedSelectedRowModel()?.flatRows?.[0]

    if (event.key === 'Enter' && selectedRow) {
      hideModal()
      handleOpen(event, selectedRow)
      return
    }

    if (event.key === ' ' && selectedRow) {
      handleOpen(event, selectedRow)
      return
    }

    if (event.key === 'Escape') {
      selectedRow?.toggleSelected(false)
      return
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const currentIndex = selectedRow ? (rowIndexMap.get(selectedRow.id) ?? -1) : -1

      let nextIndex: number | undefined

      if (currentIndex === -1) {
        // No row selected, select first or last based on direction
        nextIndex = event.key === 'ArrowDown' ? 0 : navigableRows.length - 1
      } else if (event.key === 'ArrowDown' && currentIndex < navigableRows.length - 1) {
        nextIndex = currentIndex + 1
      } else if (event.key === 'ArrowUp' && currentIndex > 0) {
        nextIndex = currentIndex - 1
      }

      if (nextIndex !== undefined && navigableRows[nextIndex]) {
        navigableRows[nextIndex].toggleSelected(true)

        // Open next row if PreviewSheet is open
        if (currentModal) {
          handleOpen(event, navigableRows[nextIndex])
        }
      }

      return
    }
  }, [navigableRows, rowIndexMap, table, handleOpen, hideModal, currentModal])

  useNavigationKeys({
    keys: NAVIGATION_KEYS,
    onNavigation: handleNavigation
  })

  useEffect(() => {
    if (onRowSelected) {
      const selectedRows = table.getSelectedRowModel()
      onRowSelected(selectedRows?.rows[0]?.original)
    }
  }, [table, onRowSelected])

  const rows = table.getRowModel().rows

  const TableBodyElement = useMemo(() => {
    const isGrouped = groupingLength > 0

    return rows.map((row) => isGrouped
      ? (
          <GroupedRows<TData, TValue>
            key={row.id}
            row={row}
            columns={columns}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
            align={rowAlign}
          />
        )
      : (
          <Row
            key={row.id}
            row={row}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
            align={rowAlign}
          />
        )
    )
  }, [rows, columns, handleOpen, groupingLength, openDocuments, rowAlign])

  return (
    <>
      {children}
      <_Table className='table-fixed relative'>
        <TableBody>
          {TableBodyElement}
        </TableBody>
      </_Table>
    </>
  )
}
