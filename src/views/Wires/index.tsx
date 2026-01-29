import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useCallback, useRef, useState, useMemo, type JSX, useEffect } from 'react'
import { useView } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import { Stream } from './components/Stream'
import { useStreamNavigation } from './hooks/useStreamNavigation'
import type { Wire } from '@/shared/schemas/wire'
import { Preview } from './components/Preview'
import { getWireStatus } from '@/components/Table/lib/getWireStatus'
import type { RowSelectionState, Updater } from '@tanstack/react-table'
import { WiresToolbar } from './components/WiresToolbar'
import { useWireViewState } from './hooks/useWireViewState'

const BASE_URL = import.meta.env.BASE_URL

const meta: ViewMetadata = {
  name: 'Wires',
  path: `${BASE_URL}/wires`,
  widths: {
    sm: 12,
    md: 12,
    lg: 12,
    xl: 8,
    '2xl': 8,
    hd: 8,
    fhd: 8,
    qhd: 8,
    uhd: 6
  }
}

const EXAMPLE_STATE = {
  title: 'Utrikesbevakning',
  type: 'tt/wires-panes',
  content: [
    {
      uuid: '1582b455-682b-496e-8d1e-94ef809f6e5e',
      title: 'APA Economy',
      meta: [
        { role: 'filter', type: 'core/section', value: '111932dc-99f3-4ba4-acf2-ed9d9f2f1c7c' },
        { role: 'filter', type: 'tt/source', value: 'wires://source/apa' }
      ]
    },
    {
      uuid: '3d2542c0-39ca-4438-9c87-7a3efdb9e7b7',
      title: 'NTB',
      meta: [
        { role: 'filter', type: 'tt/source', value: 'wires://source/ntb' }
      ]
    }
  ]
}

export const Wires = (): JSX.Element => {
  const { isActive } = useView()
  const [previewWire, setPreviewWire] = useState<Wire | null>(null)
  const [focusedWire, setFocusedWire] = useState<Wire | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    streams,
    addStream,
    removeStream,
    setFilter,
    clearFilter
  } = useWireViewState(EXAMPLE_STATE)

  // Global row selection state for all streams
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Store wire data reference for selected rows
  // NOTE: Temporarily disabled to fix infinite re-render - selection may not work properly
  const [wireDataMap] = useState<Map<string, Wire>>(new Map())

  useStreamNavigation({
    isActive,
    containerRef,
    wrapNavigation: false
  })

  const handleOnPress = useCallback((wire: Wire) => {
    setPreviewWire(wire)
  }, [])

  const handleOnUnpress = useCallback(() => {
    setPreviewWire(null)
  }, [])

  const handleOnFocus = useCallback((wire: Wire) => {
    setFocusedWire(wire)
    setPreviewWire((curr) => {
      return curr ? wire : null
    })
  }, [])

  // Track focus loss
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const handleFocusOut = (event: FocusEvent) => {
      // Check if focus is moving outside the container
      const relatedTarget = event.relatedTarget as HTMLElement | null

      // If relatedTarget is null or not within container, we've lost focus
      if (!relatedTarget || !container.contains(relatedTarget)) {
        setFocusedWire(null)
      }
    }

    container.addEventListener('focusout', handleFocusOut)
    return () => {
      container.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // NOTE: handleDataChange removed to fix infinite re-render issue
  // This means wireDataMap won't be populated, which may affect selection features
  // TODO: Re-implement data collection in a way that doesn't cause infinite loops

  // Update wire data map when selection changes - properly typed
  const handleRowSelectionChange = useCallback((updater: Updater<RowSelectionState>) => {
    setRowSelection(updater)
  }, [])

  // Get selected wires from selection state
  const selectedWires = useMemo(() => {
    const activeWires = Object.keys(rowSelection)
      .filter((id) => rowSelection[id])
      .map((id) => wireDataMap.get(id))
      .filter((wire): wire is Wire => wire !== undefined)

    if (focusedWire && !activeWires.includes(focusedWire)) {
      activeWires.push(focusedWire)
    }
    return activeWires
  }, [rowSelection, wireDataMap, focusedWire])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (!['s', 'r', 'u', 'Escape'].includes(event.key)) {
      return
    }

    if (event.key === 'Escape' && !previewWire) {
      clearSelection()
      return
    }

    const wires = [previewWire, ...selectedWires].filter((wire): wire is Wire => !!wire)
    wires.forEach((wire) => {
      const currentStatus = getWireStatus('Wires', wire)
      let newStatus = 'draft'
      switch (event.key) {
        case 's':
          newStatus = currentStatus === 'saved' ? 'draft' : 'saved'
          break
        case 'r':
          newStatus = currentStatus === 'read' ? 'draft' : 'read'
          break
        case 'u':
          newStatus = currentStatus === 'used' ? 'draft' : 'used'
          break
        default:
          return
      }

      const payload = {
        name: newStatus,
        version: undefined,
        uuid: wire.id
      }
      console.log(payload)
    })
  }, [previewWire, selectedWires, clearSelection])

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Telegram' name='Wires' />

        <ViewHeader.Content>
          <WiresToolbar
            wires={[...selectedWires, focusedWire]}
            addWireStream={addStream}
          />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content variant='no-scroll' className='relative'>
        <div
          className={cn(
            'h-full overflow-hidden @7xl/view:grid-cols-[auto_1fr]',
            previewWire && 'grid grid-rows-2 @7xl/view:grid-rows-1'
          )}
          onKeyDown={handleKeyDown}
        >
          <div
            className={cn(
              'h-full overflow-x-auto overflow-y-hidden',
              previewWire && '@7xl/view:pr-2'
            )}
          >
            {/* Grid */}
            <div ref={containerRef} className='grid gap-2 p-2 pe-1 h-full snap-x snap-proximity scroll-pl-6 overflow-x-auto overflow-hidden grid-flow-col auto-cols-max'>
              {streams.map((wireStream) => (
                <Stream
                  key={wireStream.uuid}
                  wireStream={wireStream}
                  onPress={handleOnPress}
                  onUnpress={handleOnUnpress}
                  onFocus={handleOnFocus}
                  rowSelection={rowSelection}
                  onRowSelectionChange={handleRowSelectionChange}
                  onRemove={removeStream}
                  onFilterChange={setFilter}
                  onClearFilter={clearFilter}
                />
              ))}
            </div>
          </div>

          {!!previewWire
            && (
              <div
                className={cn(
                  'rounded-lg grid shadow-xl border border-default-foreground/20 mx-1',
                  'grid-rows-[auto_1fr]',
                  '@7xl/view:ml-0 @7xl/view:w-xl @7xl/view:my-2 @7xl/view:mx-0'
                )}
              >
                <Preview
                  wire={previewWire}
                  onClose={() => setPreviewWire(null)}
                />
              </div>
            )}
        </div>

        {selectedWires.length > 0 && (
          <div className='absolute bottom-4 left-0 right-0 flex justify-center items-center'>
            <div className='border bg-background rounded-lg text-sm px-5 py-3 shadow-xl flex flex-col items-center gap-1'>
              <div className='flex flex-row items-center gap-2 justify-items-center text-center'>
                <div className='overflow-hidden truncate max-w-100 min-w-80'>
                  {`${selectedWires[0].fields['document.title']?.values[0] ?? selectedWires[0].fields['document.title']?.values[0]}`}
                </div>

                {selectedWires.length > 1 && (
                  <span className='inline-block bg-muted px-2 py-0.5 rounded-md text-xs font-medium'>
                    +
                    {selectedWires.length - 1}
                  </span>
                )}
              </div>
              <div className='text-center text-muted-foreground text-xs'>
                <span className='bg-muted px-2 py-0.5 rounded-md text-xs font-semibold'>ESC</span>
                {selectedWires.length && (
                  <>
                    {' '}
                    <span>för att ta avmarkera valda telegram</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </View.Content>
    </View.Root>
  )
}

Wires.meta = meta
