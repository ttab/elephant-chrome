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
import { Toolbar } from './Toolbar'
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
import { NewItems } from './NewItems'
import { Row } from './Row'
import { useModal } from '../Modal/useModal'
import { PreviewSheet } from '@/views/Wires/components'
import type { Wire as WireType } from '@/shared/schemas/wire'
import { Wire as WireComponent } from '@/views/Wire'
import { GroupedRows } from './GroupedRows'
import { getWireStatus } from '../../lib/getWireStatus'
import { type View } from '@/types/index'
import type { DocumentState } from '@ttab/elephant-api/repositorysocket'
const BASE_URL = import.meta.env.BASE_URL

interface TableProps<TData, TValue> extends PropsWithChildren {
  columns: Array<ColumnDef<TData, TValue>>
  type: 'Planning' | 'Event' | 'Assignments' | 'Search' | 'Wires' | 'Factbox' | 'Print' | 'PrintEditor'
  onRowSelected?: (row?: TData) => void
}

function isRowTypeWire<TData, TValue>(type: TableProps<TData, TValue>['type']): type is 'Wires' {
  return type === 'Wires'
}

export const Table = <TData, TValue>({
  columns,
  type,
  onRowSelected,
  children,
  searchType
}: TableProps<TData, TValue> & { searchType?: View }): JSX.Element => {
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

    const originalId = (row.original as { id: string }).id

    showModal(
      <PreviewSheet
        id={originalId}
        wire={row.original as WireType}
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
    if (type === 'Wires') {
      handlePreview(row)
      return
    }

    const target = event.target as HTMLElement
    if (target && 'dataset' in target && !target.dataset.rowAction) {
      if (!onRowSelected) {
        return
      }

      const originalRow = row.original as DocumentState
      const id = originalRow.document?.uuid

      const articleClick = type === 'Search' && searchType === 'Editor'

      let usableVersion

      if (articleClick) {
        usableVersion = !articleClick ? undefined : originalRow?.meta?.heads.usable.version
      }

      if ('__updater' in originalRow && originalRow.__updater) {
        delete originalRow.__updater
      }

      handleLink({
        event,
        dispatch,
        viewItem: state.viewRegistry.get(!searchType ? type : searchType),
        props: { id },
        viewId: crypto.randomUUID(),
        origin,
        history,
        keepFocus: (event as KeyboardEvent)?.key === ' ',
        ...((articleClick && usableVersion) && {
          readOnly: {
            version: BigInt(usableVersion)
          }
        })
      })
    }
  }, [dispatch, state.viewRegistry, onRowSelected, origin, type, history, handlePreview, searchType])

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
        if (selectedRow && isRowTypeWire<TData, TValue>(type)) {
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
        if (selectedRow && isRowTypeWire<TData, TValue>(type)) {
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
        if (selectedRow && isRowTypeWire<TData, TValue>(type)) {
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
        if (selectedRow && isRowTypeWire<TData, TValue>(type)) {
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
    const isAssignmentsTable = window.location.pathname.includes(`${BASE_URL}/assignments`)
    const isGrouped = table.getState().grouping.length > 0
    const rowType = isAssignmentsTable ? 'Assignments' : type

    return rows.map((row) => isGrouped
      ? (
          <GroupedRows<TData, TValue>
            key={row.id}
            type={rowType}
            row={row}
            columns={columns}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
          />
        )
      : (
          <Row
            key={row.id}
            type={rowType}
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
      {!['Wires', 'Factbox', 'Search'].includes(type) && (
        <Toolbar />
      )}
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

      {children}

      {(type !== 'Search') && (
        <_Table className='table-auto relative'>
          <TableBody>
            {TableBodyElement}
          </TableBody>
        </_Table>
      )}
    </>
  )
}
