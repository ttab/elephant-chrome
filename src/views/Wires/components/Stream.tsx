import { type JSX, useMemo, useCallback, useState, useRef, useEffect } from 'react'
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
import type { WireStatus } from '../lib/setWireStatus'
import { StreamGroupHeader } from './StreamGroupHeader'

const PAGE_SIZE = 80

export const Stream = ({
  wireStream,
  onFocus,
  onUnpress,
  onPress,
  selectedWires,
  statusMutations,
  onToggleWire,
  onRemove,
  onFilterChange,
  onClearFilter
}: {
  wireStream: WireStream
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onUnpress?: (item: Wire, event: React.KeyboardEvent<HTMLElement>) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
  selectedWires: Wire[]
  statusMutations: WireStatus[]
  onToggleWire: (wire: Wire, isSelected: boolean) => void
  onRemove?: (streamId: string) => void
  onFilterChange?: (streamId: string, type: string, values: string[]) => void
  onClearFilter?: (streamId: string, type: string) => void
}): JSX.Element => {
  const [page, setPage] = useState(1)
  const [allData, setAllData] = useState<Wire[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const query = useMemo(() => constructQuery(wireStream.filters), [wireStream.filters])
  const sort = useMemo(() => [SortingV1.create({ field: 'modified', desc: true })], [])
  const options = useMemo(() => ({ setTableData: true, subscribe: true }), [])

  const { data, isLoading } = useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    size: PAGE_SIZE,
    query,
    page,
    fields,
    sort,
    options
  })

  // Merge new data with existing data
  useEffect(() => {
    if (data && !isLoading) {
      setAllData((prev) => {
        if (page === 1) {
          return data
        }

        // Merge and deduplicate by wire ID
        const existingIds = new Set(prev.map((w) => w.id))
        const newWires = data.filter((w) => !existingIds.has(w.id))
        return [...prev, ...newWires]
      })
      loadingRef.current = false
    }
  }, [data, isLoading, page])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
    setAllData([])
  }, [wireStream.filters])

  // Infinite scroll handler
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      if (loadingRef.current || isLoading) return

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      // Load more when within 300px of the bottom
      if (distanceFromBottom < 300 && data && data.length === PAGE_SIZE) {
        loadingRef.current = true
        setPage((prev) => prev + 1)
      }
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [isLoading, data])

  // Convert selected wires array to TanStack Table format
  const rowSelection = useMemo<RowSelectionState>(() => {
    const selection: RowSelectionState = {}
    selectedWires.forEach((wire) => {
      selection[wire.id] = true
    })
    return selection
  }, [selectedWires])

  const handleRowSelectionChange = useCallback<OnChangeFn<RowSelectionState>>((updaterOrValue) => {
    const newSelection = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection)
      : updaterOrValue

    // Check each row in the new selection
    Object.keys(newSelection).forEach((wireId) => {
      if (newSelection[wireId] && !rowSelection[wireId]) {
        // Newly selected
        const wire = allData?.find((w) => w.id === wireId)
        if (wire) onToggleWire(wire, true)
      }
    })

    // Check for deselections
    Object.keys(rowSelection).forEach((wireId) => {
      if (!newSelection[wireId]) {
        // Deselected
        const wire = allData?.find((w) => w.id === wireId)
        if (wire) onToggleWire(wire, false)
      }
    })
  }, [rowSelection, allData, onToggleWire])

  const removeThisWire = useCallback(() => {
    onRemove?.(wireStream.uuid)
  }, [onRemove, wireStream.uuid])

  const handleFilterChange = useCallback((type: string, values: string[]) => {
    onFilterChange?.(wireStream.uuid, type, values)
  }, [onFilterChange, wireStream.uuid])

  const handleClearFilter = useCallback((type: string) => {
    onClearFilter?.(wireStream.uuid, type)
  }, [onClearFilter, wireStream.uuid])

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
            statusMutation={statusMutations.find((mutation) => mutation.uuid === row.original.id)}
            onToggleSelected={row.getToggleSelectedHandler()}
            onPress={onPress}
            onUnpress={onUnpress}
            onFocus={onFocus}
          />
        )
      }
    ],
    [wireStream.uuid, onPress, onUnpress, onFocus, statusMutations]
  )

  const getRowId = useCallback((row: Wire) => row.id, [])
  const coreRowModel = useMemo(() => getCoreRowModel(), [])
  const emptyData = useMemo(() => [], [])

  const table = useReactTable({
    data: allData ?? emptyData,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: handleRowSelectionChange,
    getCoreRowModel: coreRowModel,
    getRowId
  })

  return (
    <div
      data-stream-id={wireStream.uuid}
      className='flex flex-col h-full snap-start snap-always min-w-80 max-w-120 border rounded-md overflow-hidden'
    >
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

      <div ref={scrollContainerRef} className='flex-1 basis-0 overflow-y-auto bg-muted'>
        <div className='flex flex-col'>
          {table.getRowModel().rows.map((row, index) => {
            const currentWire = row.original
            const currentDate = new Date(currentWire.fields.modified.values[0])
            const prevWire = index > 0 ? table.getRowModel().rows[index - 1].original : null
            const prevDate = prevWire ? new Date(prevWire.fields.modified.values[0]) : null

            const showDateHeader = !prevDate || currentDate.toDateString() !== prevDate.toDateString()
            const showTimeHeader = !showDateHeader && prevDate && currentDate.getHours() !== prevDate.getHours()

            return (
              <div key={row.id}>
                {showDateHeader && (
                  <StreamGroupHeader
                    date={currentDate.toLocaleDateString('sv-SE', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                    time={`${currentDate.getHours().toString().padStart(2, '0')}:00`}
                  />
                )}
                {showTimeHeader && (
                  <StreamGroupHeader
                    time={`${currentDate.getHours().toString().padStart(2, '0')}:00`}
                  />
                )}
                <div className='border-b last:border-b-0'>
                  {flexRender(
                    row.getVisibleCells()[0].column.columnDef.cell,
                    row.getVisibleCells()[0].getContext()
                  )}
                </div>
              </div>
            )
          })}

          {isLoading && page > 1 && (
            <div className='py-4 text-center text-sm text-muted-foreground'>
              Laddar fler...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
