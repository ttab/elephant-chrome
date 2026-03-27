import { type JSX, useMemo, useCallback, useState, useRef, useEffect, useLayoutEffect, memo } from 'react'
import { fields, type Wire, type WireFields } from '@/shared/schemas/wire'
import { getWireState } from '@/lib/getWireState'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '../lib/constructQuery'
import { SortingV1 } from '@ttab/elephant-api/index'
import { StreamEntry } from './StreamEntry'
import { XIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState
} from '@tanstack/react-table'
import { FilterValue } from './Filter/FilterValue'
import { FilterMenu } from './Filter/FilterMenu'
import type { WireFilter } from '../hooks/useWireViewState'
import { type WireStream } from '../hooks/useWireViewState'
import type { WireStatus } from '../lib/setWireStatus'
import { StreamGroupHeader } from './StreamGroupHeader'
import { REQUIRE_FILTERS } from '../lib/featureFlags'
import { getWireStatus } from '@/lib/getWireStatus'

const PAGE_SIZE = 80
const FILTER_DEBOUNCE_MS = 400

export const Stream = memo(({
  wireStream,
  onFocus,
  onPress,
  selectedWires,
  statusMutations,
  failedMutationUuids,
  onToggleWire,
  onRemove,
  onFilterChange,
  onClearFilter,
  previewWireId,
  onPreviewWireUpdate,
  focusedWireId,
  onFocusedWireUpdate
}: {
  wireStream: WireStream
  onFocus?: (item: Wire, event: React.FocusEvent<HTMLElement>) => void
  onPress?: (item: Wire, event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void
  selectedWires: Wire[]
  statusMutations: WireStatus[]
  failedMutationUuids: ReadonlySet<string>
  onToggleWire: (wire: Wire, isSelected: boolean) => void
  onRemove?: (streamId: string, wireIds: string[]) => void
  onFilterChange?: (streamId: string, type: string, values: string[]) => void
  onClearFilter?: (streamId: string, type: string) => void
  previewWireId?: string
  onPreviewWireUpdate?: (wire: Wire) => void
  focusedWireId?: string
  onFocusedWireUpdate?: (wire: Wire) => void
}): JSX.Element => {
  const { t } = useTranslation('wires')
  const [page, setPage] = useState(1)
  const [allData, setAllData] = useState<Wire[]>([])
  const allDataRef = useRef<Wire[]>([])
  const streamContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const lastToggledWireIdRef = useRef<string | null>(null)
  const shiftAnchorRef = useRef<string | null>(null)
  const mutationSnapshotRef = useRef<Map<string, Wire['fields']>>(new Map())
  // Snapshot of pre-mutation fields kept after a successful mutation so the merge
  // can detect when server data still reflects the old (pre-mutation) state.
  const convergeSnapshotRef = useRef<Map<string, Wire['fields']>>(new Map())
  const statusMutationsRef = useRef<WireStatus[]>(statusMutations)
  statusMutationsRef.current = statusMutations

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

      // First page replaces everything, but preserve any status head versions from prev
      // that are ahead of what the server returned (e.g. OpenSearch hasn't indexed the
      // status change yet, especially for text-filter streams where the subscription fires
      // for new wires rather than for the status-field change on the current wire).
      if (page === 1) {
        const prevById = new Map(prev.map((w) => [w.id, w]))
        next = data.map((wire) => {
          const existing = prevById.get(wire.id)
          if (!existing) return wire

          const snapshot = convergeSnapshotRef.current.get(wire.id)
          let mergedFields = wire.fields
          let converged = !!snapshot

          for (const head of ['read', 'saved', 'used', 'flash'] as const) {
            const prevVer = parseInt(existing.fields[`heads.${head}.version`]?.values[0] ?? '0', 10)
            const dataVer = parseInt(wire.fields[`heads.${head}.version`]?.values[0] ?? '0', 10)

            if (snapshot) {
              const snapshotVer = parseInt(snapshot[`heads.${head}.version`]?.values[0] ?? '0', 10)
              // Server still shows the pre-mutation value for this head — it hasn't
              // indexed the change yet. Preserve allData's optimistic fields regardless
              // of version direction (critical for draft toggles where version goes to 0).
              if (!isNaN(snapshotVer) && !isNaN(dataVer) && dataVer === snapshotVer && prevVer !== dataVer) {
                mergedFields = {
                  ...mergedFields,
                  [`heads.${head}.version`]: existing.fields[`heads.${head}.version`],
                  [`heads.${head}.created`]: existing.fields[`heads.${head}.created`]
                }
                converged = false
                continue
              }
            }

            if (!isNaN(prevVer) && !isNaN(dataVer) && prevVer > dataVer) {
              mergedFields = {
                ...mergedFields,
                [`heads.${head}.version`]: existing.fields[`heads.${head}.version`],
                [`heads.${head}.created`]: existing.fields[`heads.${head}.created`]
              }
            }
          }

          if (converged) {
            convergeSnapshotRef.current.delete(wire.id)
          }

          return mergedFields === wire.fields ? wire : { ...wire, fields: mergedFields }
        })
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

      const wireStatusFilter = wireStream.filters.find((f) => f.type === 'wireStatus')
      if (wireStatusFilter?.values.length) {
        next = filterStatuses(next, wireStatusFilter)
      }
      allDataRef.current = next
      return next
    })

    if (!isLoading) {
      loadingRef.current = false
    }
  }, [data, isLoading, page, wireStream.filters])

  // Reset to page 1 when debounced filters change.
  // Don't clear allData here — the data effect replaces it on page 1 once the fetch completes,
  // avoiding a blank state during the loading period.
  useEffect(() => {
    setPage(1)
  }, [debouncedFilters])

  // When mutations arrive, apply optimistic field updates directly to allData so that
  // page 2+ wires (not covered by the subscription refetch) also show the correct status
  // immediately after the mutation spinner clears.
  // useLayoutEffect fires before paint, so both this and the triggered re-render
  // commit before the browser paints — one visual frame instead of two.
  useLayoutEffect(() => {
    if (statusMutations.length) {
      const snapshot = new Map<string, Wire['fields']>()
      setAllData((prev) => {
        const next = prev.map((wire) => {
          const mutation = statusMutations.find((m) => m.uuid === wire.id)
          if (!mutation) return wire

          snapshot.set(wire.id, wire.fields)

          const version = String(mutation.version)
          let updatedFields: Wire['fields']

          if (mutation.name === 'draft') {
            updatedFields = {
              ...wire.fields,
              'heads.read.version': { values: ['0'] },
              'heads.saved.version': { values: ['0'] },
              'heads.used.version': { values: ['0'] }
            }
          } else {
            const optimisticCreated = new Date().toISOString()
            updatedFields = {
              ...wire.fields,
              [`heads.${mutation.name}.version`]: { values: [version] },
              [`heads.${mutation.name}.created`]: { values: [optimisticCreated] }
            }
          }

          return { ...wire, fields: updatedFields }
        })
        allDataRef.current = next
        return next
      })
      mutationSnapshotRef.current = snapshot
    } else if (mutationSnapshotRef.current.size > 0) {
      // Mutations cleared (success path): transfer the pre-mutation snapshot so the
      // merge effect can detect stale server data that still matches the old state.
      convergeSnapshotRef.current = new Map([
        ...convergeSnapshotRef.current,
        ...mutationSnapshotRef.current
      ])
      mutationSnapshotRef.current = new Map()
    }
  }, [statusMutations])

  // Rollback fields for wires whose status mutation failed
  useLayoutEffect(() => {
    if (!failedMutationUuids.size) return

    const snapshot = mutationSnapshotRef.current
    setAllData((prev) => {
      const next = prev.map((wire) => {
        if (!failedMutationUuids.has(wire.id)) return wire
        const original = snapshot.get(wire.id)
        return original ? { ...wire, fields: original } : wire
      })
      allDataRef.current = next
      return next
    })
    // Rollback restored originals — no convergence protection needed for these wires
    for (const uuid of failedMutationUuids) {
      convergeSnapshotRef.current.delete(uuid)
    }
    mutationSnapshotRef.current = new Map()
  }, [failedMutationUuids])

  // Notify parent when the previewed or focused wire's data changes in allData
  const lastPreviewWireRef = useRef<Wire | null>(null)
  const lastFocusedWireRef = useRef<Wire | null>(null)
  useEffect(() => {
    if (previewWireId && onPreviewWireUpdate) {
      const found = allData.find((w) => w.id === previewWireId)
      if (found && found !== lastPreviewWireRef.current) {
        lastPreviewWireRef.current = found
        onPreviewWireUpdate(found)
      }
    }

    if (focusedWireId && onFocusedWireUpdate) {
      const found = allData.find((w) => w.id === focusedWireId)
      if (found && found !== lastFocusedWireRef.current) {
        lastFocusedWireRef.current = found
        onFocusedWireUpdate(found)
      }
    }
  }, [allData, previewWireId, onPreviewWireUpdate, focusedWireId, onFocusedWireUpdate])

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

  const filterStatuses = (wires: Wire[], wireStatusFilter: WireFilter): Wire[] => {
    const selectedStatuses = new Set(wireStatusFilter.values)

    return wires.filter((wire) => {
      const currentStatus = getWireState(wire)
      const lastStatus = getWireStatus(wire)
      return selectedStatuses.has(currentStatus.status) || selectedStatuses.has(lastStatus)
    })
  }

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

  // Shift+Arrow: extend/contract selection (like text selection in an editor)
  useEffect(() => {
    const handleShiftNavigation = (e: KeyboardEvent) => {
      if (!e.shiftKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const container = streamContainerRef.current
      if (!container || !container.contains(document.activeElement)) return

      const focusedEl = document.activeElement?.closest<HTMLElement>('[data-item-id]')
      if (!focusedEl) return

      const entryId = focusedEl.getAttribute('data-entry-id')
      if (!entryId) return

      const items = Array.from(container.querySelectorAll<HTMLElement>('[data-item-id]'))
      const currentIndex = items.indexOf(focusedEl)
      if (currentIndex === -1) return

      const nextIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1
      if (nextIndex < 0 || nextIndex >= items.length) return

      const nextEl = items[nextIndex]
      const nextEntryId = nextEl.getAttribute('data-entry-id')
      if (!nextEntryId) return

      // On the first Shift+Arrow press, set the anchor and mark the starting entry
      if (!shiftAnchorRef.current) {
        shiftAnchorRef.current = entryId
        const currentWire = allDataRef.current.find((w) => w.id === entryId)
        if (currentWire && getWireState(currentWire).status !== 'used') {
          onToggleWire(currentWire, true)
          lastToggledWireIdRef.current = entryId
        }
      }

      const anchorIndex = items.findIndex(
        (el) => el.getAttribute('data-entry-id') === shiftAnchorRef.current
      )

      // Moving away from anchor extends the selection; moving toward it contracts it
      const movingAway = anchorIndex === -1
        || Math.abs(nextIndex - anchorIndex) >= Math.abs(currentIndex - anchorIndex)

      if (movingAway) {
        const nextWire = allDataRef.current.find((w) => w.id === nextEntryId)
        if (nextWire && getWireState(nextWire).status !== 'used') {
          onToggleWire(nextWire, true)
          lastToggledWireIdRef.current = nextEntryId
        }
      } else {
        const currentWire = allDataRef.current.find((w) => w.id === entryId)
        if (currentWire) {
          onToggleWire(currentWire, false)
          lastToggledWireIdRef.current = nextEntryId
        }
      }

      e.preventDefault()
      nextEl.focus()
    }

    // Reset the anchor when Shift is released so the next Shift+Arrow starts fresh
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftAnchorRef.current = null
      }
    }

    document.addEventListener('keydown', handleShiftNavigation)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleShiftNavigation)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [onToggleWire])

  const removeThisWire = useCallback(() => {
    onRemove?.(wireStream.uuid, allDataRef.current.map((w) => w.id))
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
            statusMutation={statusMutationsRef.current.find((m) => m.uuid === row.original.id)}
            onToggleSelected={handleToggleSelected}
            onPress={onPress}
            onFocus={onFocus}
          />
        )
      }
    ],
    [wireStream.uuid, onPress, onFocus, handleToggleSelected]
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
        : `time-${currentDate.toDateString()}-${currentDate.getHours()}-${row.id}`

      const isToday = currentDate.toDateString() === new Date().toDateString()

      groups.push({
        key,
        header: (
          <StreamGroupHeader
            date={
              !isToday
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
      ref={streamContainerRef}
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
              <p className='text-sm text-muted-foreground'>{t('stream.addFilter')}</p>
            </div>
          )
        : (
            <div ref={scrollContainerRef} className='flex-1 basis-0 overflow-y-auto bg-muted'>
              <div className='flex flex-col'>
                {groups.map((group) => (
                  <div key={group.key}>
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
                    {t('stream.loadingMore')}
                  </div>
                )}
              </div>
            </div>
          )}

    </div>
  )
})

Stream.displayName = 'Stream'
