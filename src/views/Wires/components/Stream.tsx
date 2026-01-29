import { type JSX, useMemo, useCallback, useState } from 'react'
import { fields, type Wire, type WireFields } from '@/shared/schemas/wire'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '../lib/constructQuery'
import { SortingV1 } from '@ttab/elephant-api/index'
import { StreamEntry } from './StreamEntry'
import { MinusIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type OnChangeFn
} from '@tanstack/react-table'
import { FilterValue } from './Filter/FilterValue'
import { FilterMenu } from './Filter/FilterMenu'
import { type WireStream } from '../hooks/useWireViewState'

export const Stream = ({
  wireStream,
  onFocus,
  onUnpress,
  onPress,
  rowSelection,
  onRowSelectionChange,
  onRemove,
  onFilterChange,
  onClearFilter
}: {
  wireStream: WireStream
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onUnpress?: (item: Wire, event: React.KeyboardEvent<HTMLElement>) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: OnChangeFn<RowSelectionState>
  onRemove?: (streamId: string) => void
  onFilterChange?: (streamId: string, type: string, values: string[]) => void
  onClearFilter?: (streamId: string, type: string) => void
}): JSX.Element => {
  // FIXME: Pagination
  const [page] = useState(1)

  // Memoize the query to prevent unnecessary re-renders
  const query = useMemo(() => constructQuery(wireStream.filters), [wireStream.filters])

  // Memoize sort to prevent re-creating on every render
  const sort = useMemo(() => {
    return [SortingV1.create({ field: 'modified', desc: true })]
  }, [])

  // Memoize options to prevent re-creating on every render
  const options = useMemo(() => ({
    setTableData: true,
    subscribe: true
  }), [])

  const { data } = useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    size: 40,
    query,
    page: typeof page === 'string' ? parseInt(page) : undefined,
    fields,
    sort,
    options
  })

  const removeThisWire = useCallback(() => {
    onRemove?.(wireStream.uuid)
  }, [onRemove, wireStream.uuid])

  const handleFilterChange = useCallback((type: string, values: string[]) => {
    onFilterChange?.(wireStream.uuid, type, values)
  }, [onFilterChange, wireStream.uuid])

  const handleClearFilter = useCallback((type: string) => {
    onClearFilter?.(wireStream.uuid, type)
  }, [onClearFilter, wireStream.uuid])

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<Wire>[]>(
    () => [
      {
        id: 'entry',
        accessorFn: (row) => row,
        cell: ({ row }) => (
          <StreamEntry
            streamId={wireStream.uuid}
            entry={row.original}
            isSelected={row.getIsSelected()}
            onToggleSelected={row.getToggleSelectedHandler()}
            onPress={onPress}
            onUnpress={onUnpress}
            onFocus={onFocus}
          />
        )
      }
    ],
    [wireStream.uuid, onPress, onUnpress, onFocus]
  )

  // Memoize the row ID getter to prevent re-creating on every render
  const getRowId = useCallback((row: Wire) => row.id, [])

  // Memoize the core row model to prevent re-creating on every render
  const coreRowModel = useMemo(() => getCoreRowModel(), [])

  // Memoize empty array to prevent creating new reference on every render when data is undefined
  const emptyData = useMemo(() => [], [])

  const table = useReactTable({
    data: data ?? emptyData,
    columns,
    state: {
      rowSelection
    },
    enableRowSelection: true,
    onRowSelectionChange,
    getCoreRowModel: coreRowModel,
    getRowId
  })

  return (
    <div
      data-stream-id={wireStream.uuid}
      className='flex flex-col h-full snap-start snap-always min-w-80 max-w-120 border rounded-md overflow-hidden'
    >
      {/* Column header - fixed height */}
      <div className='flex-none bg-background flex items-center justify-between py-1 px-4 border-b'>
        <div className='flex gap-2'>
          <FilterMenu
            streamId={wireStream.uuid}
            currentFilters={wireStream.filters}
            onFilterChange={handleFilterChange}
          />

          {wireStream.filters.map((filter) => (
            <FilterValue
              key={filter.type}
              type={filter.type}
              values={filter.values}
              onClearFilter={handleClearFilter}
            />
          ))}

        </div>

        <div>
          <Button variant='ghost' className='w-9 h-9 px-0' onClick={removeThisWire}>
            <MinusIcon strokeWidth={1.75} size={18} />
          </Button>
        </div>
      </div>

      {/* Column content - fills remaining space and scrolls */}
      <div className='flex-1 basis-0 overflow-y-auto bg-muted'>
        <div className='flex flex-col divide-y'>
          {table.getRowModel().rows.map((row) => (
            <div key={row.id}>
              {flexRender(
                row.getVisibleCells()[0].column.columnDef.cell,
                row.getVisibleCells()[0].getContext()
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
