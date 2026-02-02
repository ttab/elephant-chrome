import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useCallback, useRef, useState, type JSX, useEffect } from 'react'
import { useRegistry, useView } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import { Stream } from './components/Stream'
import { useStreamNavigation } from './hooks/useStreamNavigation'
import type { Wire } from '@/shared/schemas/wire'
import { Preview } from './components/Preview'
import { WiresToolbar } from './components/WiresToolbar'
import { useWireViewState } from './hooks/useWireViewState'
import type { WireStatus } from './lib/setWireStatus'
import { calculateWireStatuses, executeWiresStatuses } from './lib/setWireStatus'
import { useSession } from 'next-auth/react'

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
  const { repository } = useRegistry()
  const { data: session } = useSession()
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

  const [selectedWires, setSelectedWires] = useState<Wire[]>([])
  const [statusMutations, setStatusMutations] = useState<WireStatus[]>([])

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
      const relatedTarget = event.relatedTarget as HTMLElement | null
      if (!relatedTarget || !container.contains(relatedTarget)) {
        setFocusedWire(null)
      }
    }

    container.addEventListener('focusout', handleFocusOut)
    return () => {
      container.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  // Add or remove a wire from selectedWires
  const handleToggleWire = useCallback((wire: Wire, isSelected: boolean) => {
    setSelectedWires((prev) => {
      if (isSelected) {
        return [...prev, wire]
      } else {
        return prev.filter((w) => w.id !== wire.id)
      }
    })
  }, [])

  const onAction = useCallback((newStatus: 'read' | 'used' | 'saved') => {
    if (!repository || !session) return

    const wires = selectedWires.length
      ? [...selectedWires]
      : focusedWire ? [focusedWire] : []
    const nextStatuses = calculateWireStatuses(wires, newStatus)
    void executeWiresStatuses(repository, session, nextStatuses)
    setStatusMutations(nextStatuses)
    setSelectedWires([])
  }, [selectedWires, focusedWire, repository, session])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.getModifierState('Control')
      || event.getModifierState('Meta')
      || event.getModifierState('Alt')
    ) {
      return
    }

    if (event.key === 'Escape' && !previewWire) {
      setSelectedWires([])
    } else if (event.key === 's') {
      onAction('saved')
    } else if (event.key === 'r') {
      onAction('read')
    } else if (event.key === 'u') {
      onAction('used')
    }
  }, [previewWire, onAction])

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Telegram' name='Wires' />

        <ViewHeader.Content>
          <WiresToolbar
            disabled={selectedWires.length === 0 && !focusedWire}
            onAddStream={addStream}
            onAction={onAction}
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
            <div ref={containerRef} className='grid gap-2 p-2 pe-1 h-full snap-x snap-proximity scroll-pl-6 overflow-x-auto overflow-hidden grid-flow-col auto-cols-max'>
              {streams.map((wireStream) => (
                <Stream
                  key={wireStream.uuid}
                  wireStream={wireStream}
                  onPress={handleOnPress}
                  onUnpress={handleOnUnpress}
                  onFocus={handleOnFocus}
                  selectedWires={selectedWires}
                  onToggleWire={handleToggleWire}
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
          <div className='absolute top-1 left-0 right-0 flex justify-center items-center'>
            <div className='border bg-background rounded-lg text-sm px-5 py-3 shadow-xl flex flex-col items-center gap-1'>
              <div className='flex flex-row items-center gap-2 justify-items-center text-center'>
                <div className='overflow-hidden truncate max-w-100 min-w-60'>
                  {`${selectedWires[0].fields['document.title']?.values[0]}`}
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
                <span> för att ta avmarkera valda telegram</span>
              </div>
            </div>
          </div>
        )}
      </View.Content>
    </View.Root>
  )
}

Wires.meta = meta
