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
import {
  useNavigation,
  useView,
  useTable,
  useHistory,
  useNavigationKeys,
  useOpenDocuments,
  useWorkflowStatus,
  useQuery
} from '@/hooks'
import { handleLink } from '@/components/Link/lib/handleLink'
import { NewItems } from './NewItems'
import { LoadingText } from '../LoadingText'
import { Row } from './Row'
import { useModal } from '../Modal/useModal'
import { PreviewSheet } from '@/views/Wires/components'
import type { Wire as WireType } from '@/shared/schemas/wire'
import { Wire } from '@/views/Wire'
import { GroupedRows } from './GroupedRows'
import { getWireStatus } from './lib/getWireStatus'
import type { ViewType } from '@/types/index'
import { type View } from '@/types/index'
const BASE_URL = import.meta.env.BASE_URL

interface TableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  type: ViewType
  onRowSelected?: (row?: TData) => void
}

function isRowTypeWire<TData, TValue>(type: TableProps<TData, TValue>['type']): type is 'Wires' {
  return type === 'Wires'
}

function getNextTableIndex(
  rows: Record<string, RowType<unknown>>,
  selectedRowIndex: number | undefined,
  direction: 'ArrowUp' | 'ArrowDown'): number | undefined {
  const keys = Object.keys(rows)
    .map(Number)
    .filter((numKey) => !isNaN(numKey))

  if (keys.length === 0) {
    return undefined
  }

  let currentIndex = selectedRowIndex !== undefined ? keys.indexOf(selectedRowIndex) : -1

  if (direction === 'ArrowDown') {
    if (currentIndex < keys.length - 1) {
      currentIndex += 1
    } else {
      return undefined
    }
  } else if (direction === 'ArrowUp') {
    if (currentIndex > 0) {
      currentIndex -= 1
    } else {
      return undefined
    }
  }

  return keys[currentIndex]
}

export const Table = <TData, TValue>({
  columns,
  type,
  onRowSelected,
  searchType
}: TableProps<TData, TValue> & { searchType?: View }): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const { viewId: origin } = useView()
  const { table, loading } = useTable()
  const openDocuments = useOpenDocuments({ idOnly: true })
  const { showModal, hideModal, currentModal } = useModal()
  const [, setDocumentStatus] = useWorkflowStatus()
  const [,,allParams] = useQuery(['id'], true)
  const activeId = allParams?.filter((item) => {
    return item.name === 'PrintEditor'
  })?.[0]?.params?.id as string

  const handlePreview = useCallback((row: RowType<unknown>): void => {
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


  const handleOpen = useCallback((event: MouseEvent<HTMLTableRowElement> | KeyboardEvent, row: RowType<unknown>): void => {
    if (type === 'Wires') {
      handlePreview(row)
      return
    }

    const target = event.target as HTMLElement
    if (target && 'dataset' in target && !target.dataset.rowAction) {
      if (!onRowSelected) {
        return
      }

      const originalRow = row.original as { _id: string | undefined, id: string, fields?: Record<string, string[]> }
      const id = originalRow._id ?? originalRow.id

      const articleClick = type === 'Search' && searchType === 'Editor'

      let usableVersion

      if (articleClick) {
        usableVersion = !articleClick ? undefined : originalRow?.fields?.['heads.usable.version']?.[0] as bigint | undefined
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
      const rows = table.getRowModel().rowsById
      if (!Object.values(rows)?.length) {
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

      if (event.key === 'r') {
        if (selectedRow && isRowTypeWire<TData, TValue>(type)) {
          const wireRow = selectedRow as RowType<WireType>
          const currentStatus = getWireStatus(type, wireRow.original)
          if (currentStatus === 'used') {
            return
          }

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
          const wireRow = selectedRow as RowType<WireType>
          const currentStatus = getWireStatus(type, wireRow.original)

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
          const wireRow = selectedRow as RowType<WireType>
          const currentStatus = getWireStatus(type, wireRow.original)
          if (currentStatus === 'used') {
            return
          }

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
          const wireRow = selectedRow as RowType<WireType>

          const onDocumentCreated = () => {
            void setDocumentStatus({
              name: 'used',
              uuid: wireRow.original.id,
              version: BigInt(wireRow.original.fields.current_version.values?.[0])
            }, undefined, true)
          }
          showModal(
            <Wire
              onDialogClose={hideModal}
              asDialog
              wire={wireRow.original}
              onDocumentCreated={onDocumentCreated}
            />
          )
        }
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const nextKey = getNextTableIndex(rows, selectedRow?.index, event.key)
        if (nextKey !== undefined) {
          rows[nextKey].toggleSelected(true)
        }

        // Open next row if PreviewSheet is open
        if (currentModal && nextKey) {
          handleOpen(event, rows[nextKey])
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

  const rows = table.getRowModel().rows
  const rowSelection = table.getState().rowSelection

  const TableBodyElement = useMemo(() => {
    if (loading || !rows?.length) {
      const isSearchTable = window.location.pathname.includes(`${BASE_URL}/search`)
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
    const isAssignmentsTable = window.location.pathname.includes(`${BASE_URL}/assignments`)

    return rows.map((row, index) => (
      table.getState().grouping.length)
      ? (
          <GroupedRows<TData, TValue>
            key={index}
            type={isAssignmentsTable ? 'Assignments' : type}
            row={row}
            columns={columns}
            handleOpen={handleOpen}
            openDocuments={openDocuments}
            activeId={activeId}
          />
        )
      : (
          <Row
            key={index}
            type={isAssignmentsTable ? 'Assignments' : type}
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
      {!['Wires', 'Factbox', 'Search', 'Concept'].includes(type) && (
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
