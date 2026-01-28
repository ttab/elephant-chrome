import { type JSX, useMemo, useEffect, useCallback, useState } from 'react'
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
import { type WireStream } from '../hooks/useWireViewState'

export const Stream = ({
  wireStream,
  onFocus,
  onUnpress,
  onPress,
  rowSelection,
  onRowSelectionChange,
  onDataChange,
  onRemove
}: {
  wireStream: WireStream
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onUnpress?: (item: Wire, event: React.KeyboardEvent<HTMLElement>) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
  rowSelection: RowSelectionState
  onRowSelectionChange: OnChangeFn<RowSelectionState>
  onDataChange?: (data: Wire[]) => void
  onRemove?: (streamId: string) => void
}): JSX.Element => {
  // FIXME: Pagination
  const [page] = useState(1)

  const { data } = useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    size: 40,
    query: constructQuery(wireStream.filters),
    page: typeof page === 'string' ? parseInt(page) : undefined,
    fields,
    sort: [
      SortingV1.create({ field: 'modified', desc: true })
    ],
    options: {
      setTableData: true,
      subscribe: true
    }
  })

  const removeThisWire = useCallback(() => {
    onRemove?.(wireStream.uuid)
  }, [onRemove, wireStream.uuid])

  // Notify parent when data changes
  useEffect(() => {
    if (data && onDataChange) {
      onDataChange(data)
    }
  }, [data, onDataChange])

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

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      rowSelection
    },
    enableRowSelection: true,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id
  })

  return (
    <div
      data-stream-id={wireStream.uuid}
      className='flex flex-col h-full snap-start snap-always min-w-80 max-w-120 border rounded-md overflow-hidden'
    >
      {/* Column header - fixed height */}
      <div className='flex-none bg-background flex items-center justify-between py-1 px-4 border-b'>
        <div className='flex gap-2'>
          {/* <StreamToolbar
            page={String(1)}
            pages={[String(1)]}
            setPages={() => { }}
            search={undefined}
            setSearch={() => { }}
          /> */}

          {wireStream.filters.map((filter) => (
            <FilterValue
              key={filter.type}
              type={filter.type}
              values={filter.values}
              onClearFilter={() => { }}
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
