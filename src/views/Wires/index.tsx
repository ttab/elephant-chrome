import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useCallback, useRef, useState, type JSX, useEffect } from 'react'
import { useRegistry, useView, useNavigationKeysView } from '@/hooks'
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
import { toast } from 'sonner'
import { useModal } from '@/components/Modal/useModal'
import { Wire as WireView } from '@/views'

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
  const { showModal, hideModal } = useModal()
  const [previewKey, setPreviewKey] = useState(0)
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

  // Mutate selected wires to a new status
  const onAction = useCallback((newStatus: 'read' | 'used' | 'saved') => {
    if (!repository || !session) return

    const wires = selectedWires.length
      ? [...selectedWires]
      : focusedWire ? [focusedWire] : []
    const nextStatuses = calculateWireStatuses(wires, newStatus)

    // Store currently focused element
    const activeElement = document.activeElement as HTMLElement
    const focusedItemId = activeElement?.getAttribute('data-item-id')

    // Clear selected statuses and start mutations
    setStatusMutations(nextStatuses)
    setSelectedWires([])

    // Execute wire status changes and wait for completion.
    // Using setTimeout for to avoid the progress spinner to blink and disappear too quickly.
    void executeWiresStatuses(repository, session, nextStatuses).then((result) => {
      setTimeout(() => {
        setStatusMutations([])

        // Force preview to reload if it's showing one of the updated wires
        if (previewWire && nextStatuses.find((s) => s.uuid === previewWire.id)) {
          setPreviewKey((prev) => prev + 1)
        }

        // Restore focus if we had a focused item
        if (focusedItemId) {
          requestAnimationFrame(() => {
            const elementToFocus = document.querySelector(`[data-item-id="${focusedItemId}"]`) as HTMLElement
            elementToFocus?.focus()
          })
        }
      }, 100)

      if (result.find((r) => !r.statusSet)) {
        toast.error('Någon eller några status-ändringar misslyckades!')
      }
    })
  }, [selectedWires, focusedWire, repository, session, previewWire])

  // Create a new article based on selected wires
  const onCreate = useCallback(() => {
    if (!repository || !session) return

    const wires = selectedWires.length
      ? [...selectedWires]
      : focusedWire ? [focusedWire] : []

    // FIXME: This will make focus lost
    showModal(
      <WireView
        onDialogClose={hideModal}
        asDialog
        wires={wires}
        onDocumentCreated={() => onAction('used')}
      />
    )
  }, [selectedWires, focusedWire, repository, session, showModal, hideModal, onAction])

  const viewRef = useNavigationKeysView({
    keys: ['Escape', 's', 'r', 'u', 'c'],
    onNavigation: (event) => {
      if (
        event.getModifierState('Control')
        || event.getModifierState('Meta')
        || event.getModifierState('Alt')
      ) {
        return
      }

      switch (event.key) {
        case 'Escape':
          if (previewWire) {
            setPreviewWire(null)
          } else {
            setSelectedWires([])
          }
          break

        case 's':
          onAction('saved')
          break

        case 'r':
          onAction('read')
          break

        case 'u':
          onAction('used')
          break

        case 'c':
          onCreate()
          break
      }
    }
  })


  return (
    <View.Root ref={viewRef}>
      <ViewHeader.Root className='z-10'>
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
                  statusMutations={statusMutations}
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
                  key={previewKey}
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
                <span> för att avmarkera valda telegram</span>
              </div>
            </div>
          </div>
        )}
      </View.Content>
    </View.Root>
  )
}

Wires.meta = meta
