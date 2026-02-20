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
  useOpenDocuments,
  useWorkflowStatus
} from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import { Row } from './Row'
import { useModal } from '../Modal/useModal'
import { PreviewSheet } from '@/views/Wires/components'
import type { Wire as WireType } from '@/shared/schemas/wire'
import { Wire as WireComponent } from '@/views/Wire'
import { GroupedRows } from './GroupedRows'
import { getWireStatus } from '../../lib/getWireStatus'
import { type View } from '@/types/index'
import type { TableRowData, NavigationParams } from './types'

interface TableProps<TData extends TableRowData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  onRowSelected?: (row?: TData) => void
  resolveNavigation?: (row: TData) => NavigationParams
}

// Type guard to check if a row is a WireType based on the presence of 'document.meta.tt_wire.role' in fields
// Can be removed once Wire refinement is done
export function isWire<TData extends TableRowData>(original: TData): original is TData & WireType {
  const fields = (original as Record<string, unknown>).fields
  return typeof fields === 'object' && fields !== null && 'document.meta.tt_wire.role' in fields
}

export const Table = <TData extends TableRowData, TValue>({
  columns,
  onRowSelected,
  resolveNavigation,
  children
}: TableProps<TData, TValue> & { searchType?: View } & PropsWithChildren): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId: origin } = useView()
  const { table } = useTable()
  const openDocuments = useOpenDocuments({ idOnly: true })
  const { showModal, hideModal, currentModal } = useModal()
  const [, setDocumentStatus] = useWorkflowStatus({})

  const availableRows = table.getRowModel().rows as unknown as Array<RowType<TData>>
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
      navigableRows: rows as unknown as Array<RowType<TData>>,
      rowIndexMap: indexMap
    }
  }, [availableRows, groupingLength])

  const handlePreview = useCallback((row: RowType<TData>): void => {
    row.toggleSelected(true)

    const originalId = row.original.id

    showModal(
      <PreviewSheet
        id={originalId}
        wire={row.original as unknown as WireType}
        textOnly
        handleClose={hideModal}
      />,
      'sheet',
      {
        id: originalId
      },
      'right'
    )
  }, [hideModal, showModal])


  const handleOpen = useCallback((event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, row: RowType<TData>): void => {
    if (isWire(row.original)) {
      handlePreview(row)
      return
    }

    const target = event.target as HTMLElement
    if (target && 'dataset' in target && !target.dataset.rowAction) {
      if (!onRowSelected) {
        return
      }

      if ('__updater' in row.original) {
        delete (row.original as Record<string, unknown>).__updater
      }

      const navParams = resolveNavigation
        ? resolveNavigation(row.original)
        : { id: row.original.id }

      handleLink({
        event,
        dispatch,
        // TODO: Fix this, how do we identify searchtype
        // viewItem: state.viewRegistry.get(!searchType ? type : searchType),
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
  }, [dispatch, state.viewRegistry, onRowSelected, origin, history, handlePreview, resolveNavigation])

  useNavigationKeys({
    keys: ['ArrowUp', 'ArrowDown', 'Enter', 'Escape', ' ', 's', 'r', 'c', 'u'],
    onNavigation: (event) => {
      if (!navigableRows?.length) {
        return
      }

      const selectedRow = table.getGroupedSelectedRowModel()?.flatRows?.[0] as RowType<TData> | undefined

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

      if (event.key === 'r') {
        if (selectedRow && isWire(selectedRow.original)) {
          const wireRow = selectedRow as unknown as RowType<WireType>
          const currentStatus = getWireStatus(wireRow.original)
          void setDocumentStatus({
            name: currentStatus === 'read' ? 'draft' : 'read',
            uuid: wireRow.original.id,
            version: BigInt(wireRow.original.fields.current_version.values?.[0])
          }, undefined, true)
        }
        return
      }

      if (event.key === 'u') {
        if (selectedRow && isWire(selectedRow.original)) {
          const wireRow = selectedRow as unknown as RowType<WireType>
          const currentStatus = getWireStatus(wireRow.original)

          void setDocumentStatus({
            name: currentStatus === 'used' ? 'draft' : 'used',
            uuid: wireRow.original.id,
            version: BigInt(wireRow.original.fields.current_version.values?.[0])
          }, undefined, true)
        }
        return
      }

      if (event.key === 's') {
        if (selectedRow && isWire(selectedRow.original)) {
          const wireRow = selectedRow as unknown as RowType<WireType>
          const currentStatus = getWireStatus(wireRow.original)

          void setDocumentStatus({
            name: currentStatus === 'saved' ? 'draft' : 'saved',
            uuid: wireRow.original.id,
            version: BigInt(wireRow.original.fields.current_version.values?.[0])
          }, undefined, true)
        }
        return
      }

      if (event.key === 'c') {
        if (selectedRow && isWire(selectedRow.original)) {
          const wireRow = selectedRow as unknown as RowType<WireType>

          const onDocumentCreated = () => {
            void setDocumentStatus({
              name: 'used',
              uuid: wireRow.original.id,
              version: BigInt(wireRow.original.fields.current_version.values?.[0])
            }, undefined, true)
          }
          showModal(
            <WireComponent
              onDialogClose={hideModal}
              asDialog
              wire={wireRow.original}
              onDocumentCreated={onDocumentCreated}
            />
          )
        }
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
    }
  })

  useEffect(() => {
    if (onRowSelected) {
      const selectedRows = table.getSelectedRowModel()
      // @ts-expect-error unknown type
      onRowSelected(selectedRows?.rows[0]?.original)
    }
  }, [table, onRowSelected])

  const rows = table.getRowModel().rows as unknown as Array<RowType<TData>>
  const rowSelection = table.getState().rowSelection

  const TableBodyElement = useMemo(() => {
    const isGrouped = table.getState().grouping.length > 0

    return rows.map((row) => isGrouped
      ? (
          <GroupedRows<TData, TValue>
            key={row.id}
            row={row}
            columns={columns}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
          />
        )
      : (
          <Row
            key={row.id}
            row={row}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
          />
        )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, handleOpen, table, rowSelection])

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
