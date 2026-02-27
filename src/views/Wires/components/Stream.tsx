import { type JSX, useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { fields, type Wire, type WireFields } from '@/shared/schemas/wire'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '../lib/constructQuery'
import { SortingV1 } from '@ttab/elephant-api/index'
import { StreamEntry } from './StreamEntry'
import { XIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState
} from '@tanstack/react-table'
import { FilterValue } from './Filter/FilterValue'
import { FilterMenu } from './Filter/FilterMenu'
import { type WireStream } from '../hooks/useWireViewState'
import type { WireStatus } from '../lib/setWireStatus'
import { StreamGroupHeader } from './StreamGroupHeader'
import { REQUIRE_FILTERS } from '../lib/featureFlags'

const PAGE_SIZE = 80
const FILTER_DEBOUNCE_MS = 400

export const Stream = ({
  wireStream,
  onFocus,
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
  const allDataRef = useRef<Wire[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const lastToggledWireIdRef = useRef<string | null>(null)

  const hasFilters = wireStream.filters.length > 0
  const skipFetch = REQUIRE_FILTERS && !hasFilters

  // Debounce filters to avoid tearing down the SSE subscription on every rapid filter toggle
  const [debouncedFilters, setDebouncedFilters] = useState(wireStream.filters)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(wireStream.filters), FILTER_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [wireStream.filters])

  // Clear accumulated data when all filters are removed (returning to empty state)
  useEffect(() => {
    if (skipFetch) {
      allDataRef.current = []
      setAllData([])
      setPage(1)
    }
  }, [skipFetch])

  const query = useMemo(() => constructQuery(debouncedFilters), [debouncedFilters])
  const sort = useMemo(() => [SortingV1.create({ field: 'modified', desc: true })], [])
  const options = useMemo(() => ({ setTableData: true, subscribe: true }), [])

  const { data, isLoading } = useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    size: PAGE_SIZE,
    query,
    page,
    fields,
    sort,
    options,
    disabled: skipFetch
  })

  // Merge new data with existing data and reconcile updates from SWR
  useEffect(() => {
    if (!data) return

    setAllData((prev) => {
      let next: Wire[]

      // First page replaces everything
      if (page === 1) {
        next = data
      } else if (isLoading) {
        // Don't append paginated data while still loading
        next = prev
      } else {
        // Reconcile existing wires and merge in updates
        const byId = new Map(prev.map((w) => [w.id, w]))

        data.forEach((wire) => {
          const existing = byId.get(wire.id)
          byId.set(wire.id, existing ? { ...existing, fields: wire.fields } : wire)
        })

        next = Array.from(byId.values())
      }

      allDataRef.current = next
      return next
    })

    if (!isLoading) {
      loadingRef.current = false
    }
  }, [data, isLoading, page])

  // Reset to page 1 when debounced filters change.
  // Don't clear allData here — the data effect replaces it on page 1 once the fetch completes,
  // avoiding a blank state during the loading period.
  useEffect(() => {
    setPage(1)
  }, [debouncedFilters])

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

  const selectedWireIdsRef = useRef<Set<string>>(new Set())
  selectedWireIdsRef.current = useMemo(() => new Set(selectedWires.map((w) => w.id)), [selectedWires])

  const handleToggleSelected = useCallback((wire: Wire, shiftKey: boolean) => {
    const data = allDataRef.current
    const selectedIds = selectedWireIdsRef.current
    const currentIndex = data.findIndex((w) => w.id === wire.id)
    if (currentIndex === -1) return

    const lastIndex = lastToggledWireIdRef.current
      ? data.findIndex((w) => w.id === lastToggledWireIdRef.current)
      : -1

    if (shiftKey && lastIndex !== -1) {
      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)
      const targetSelected = !selectedIds.has(wire.id)
      data.slice(start, end + 1).forEach((w) => {
        if (selectedIds.has(w.id) !== targetSelected) {
          onToggleWire(w, targetSelected)
        }
      })
    } else {
      onToggleWire(wire, !selectedIds.has(wire.id))
    }

    lastToggledWireIdRef.current = wire.id
  }, [onToggleWire])

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
            statusMutation={statusMutations.find((m) => m.uuid === row.original.id)}
            onToggleSelected={handleToggleSelected}
            onPress={onPress}
            onFocus={onFocus}
          />
        )
      }
    ],
    [wireStream.uuid, onPress, onFocus, statusMutations, handleToggleSelected]
  )

  const table = useReactTable({
    data: allData,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id
  })

  const rows = table.getRowModel().rows

  const groups: Array<{
    key: string
    header: JSX.Element
    rows: typeof rows
  }> = []

  rows.forEach((row, index) => {
    const currentWire = row.original
    const currentDate = new Date(currentWire.fields.modified.values[0])

    const prevWire = index > 0 ? rows[index - 1].original : null
    const prevDate = prevWire
      ? new Date(prevWire.fields.modified.values[0])
      : null

    const showDateHeader
      = !prevDate || currentDate.toDateString() !== prevDate.toDateString()

    const showTimeHeader
      = !showDateHeader
        && prevDate
        && currentDate.getHours() !== prevDate.getHours()

    if (showDateHeader || showTimeHeader) {
      const key = showDateHeader
        ? `date-${currentDate.toDateString()}`
        : `time-${currentDate.toDateString()}-${currentDate.getHours()}`

      groups.push({
        key,
        header: (
          <StreamGroupHeader
            date={
              showDateHeader
                ? currentDate.toLocaleDateString('sv-SE', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
                : undefined
            }
            time={`${currentDate.getHours().toString().padStart(2, '0')}:00`}
          />
        ),
        rows: []
      })
    }

    groups[groups.length - 1].rows.push(row)
  })

  return (
    <div
      data-stream-id={wireStream.uuid}
      className='flex flex-col h-full snap-start snap-always w-110 shrink-0 border rounded-md overflow-hidden'
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

        <Button variant='ghost' className='w-9 h-9 px-0' onClick={removeThisWire}>
          <XIcon strokeWidth={1.75} size={18} />
        </Button>
      </div>

      {skipFetch
        ? (
            <div className='flex-1 basis-0 flex items-center justify-center bg-muted'>
              <p className='text-sm text-muted-foreground'>Lägg till filter för att visa telegram</p>
            </div>
          )
        : (
            <div ref={scrollContainerRef} className='flex-1 basis-0 overflow-y-auto bg-muted'>
              <div className='flex flex-col'>
                {groups.map((group) => (
                  <div key={group.key} className='relative'>
                    {group.header}

                    {group.rows.map((row) => (
                      <div key={row.id} className='border-b last:border-b-0'>
                        {flexRender(
                          row.getVisibleCells()[0].column.columnDef.cell,
                          row.getVisibleCells()[0].getContext()
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {isLoading && page > 1 && (
                  <div className='py-4 text-center text-sm text-muted-foreground'>
                    Laddar fler...
                  </div>
                )}
              </div>
            </div>
          )}

    </div>
  )
}
