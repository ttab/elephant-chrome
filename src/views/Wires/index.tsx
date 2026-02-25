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
import { useSettings } from '@/modules/userSettings'
import type { Block } from '@ttab/elephant-api/newsdoc'
import { Document } from '@ttab/elephant-api/newsdoc'
import { RpcError } from '@protobuf-ts/runtime-rpc'
import { Prompt } from '@/components'
import { REQUIRE_FILTERS } from './lib/featureFlags'

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

// Used when settings have loaded but no stored settings exist yet
const EMPTY_STATE = Document.create({
  title: 'standard',
  type: 'core/wire-panes-setting',
  content: []
})

export const Wires = (): JSX.Element => {
  const { isActive } = useView()
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { showModal, hideModal } = useModal()
  const [previewKey, setPreviewKey] = useState(0)
  const [previewWire, setPreviewWire] = useState<Wire | null>(null)
  const [focusedWire, setFocusedWire] = useState<Wire | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDirty, setIsDirty] = useState<null | boolean>(null)
  const settingsAppliedRef = useRef(false)

  const { isLoading, settings, updateSettings } = useSettings('core/wire-panes-setting')
  const {
    streams,
    addStream,
    removeStream,
    setFilter,
    clearFilter
  } = useWireViewState(EMPTY_STATE, () => {
    setIsDirty((v) => {
      return v !== null ? true : v
    })
  })

  const [selectedWires, setSelectedWires] = useState<Wire[]>([])
  const [statusMutations, setStatusMutations] = useState<WireStatus[]>([])

  const onSaveStreams = useCallback(async () => {
    try {
      const doc = Document.create({
        title: settings?.title ?? 'Default',
        type: 'core/wire-panes-setting',
        content: streams.map((stream) => {
          return {
            uuid: stream.uuid,
            type: 'core/wire-pane',
            title: stream.title || 'Wire stream',
            meta: stream.filters.reduce((currentFilters, filter) => {
              const addedFilters = filter.values.map((value) => {
                const { type } = filter
                switch (type) {
                  case 'core/source':
                    return { type, uri: value, role: 'filter' }
                  case 'core/section':
                    return { type, uuid: value, role: 'filter' }
                  case 'query':
                  case 'core/newsvalue':
                  default:
                    return { type, value, role: 'filter' }
                }
              })
              return [...currentFilters, ...addedFilters]
            }, [] as Partial<Block>[])
          }
        })
      })

      await updateSettings(doc)
      setIsDirty(false)
    } catch (error) {
      if (error instanceof RpcError) {
        const details = Object.entries(error.meta)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n')
        console.error('Failed to save wire settings:', error.message, error.meta)
        showModal(
          <Prompt
            title='Kunde inte spara inställningar'
            description={details || error.message}
            primaryLabel='Stäng'
            onPrimary={hideModal}
          />
        )
      } else {
        console.error('Failed to save wire settings:', error)
        showModal(
          <Prompt
            title='Kunde inte spara inställningar'
            description={error instanceof Error ? error.message : 'Ett okänt fel inträffade'}
            primaryLabel='Stäng'
            onPrimary={hideModal}
          />
        )
      }
    }
  }, [streams, settings?.title, updateSettings, hideModal, showModal])

  useStreamNavigation({
    isActive,
    containerRef,
    wrapNavigation: false
  })

  const handleOnPress = useCallback((wire: Wire) => {
    setPreviewWire(wire)
  }, [])

  const handleOnFocus = useCallback((wire: Wire) => {
    setFocusedWire(wire)
    setPreviewWire((curr) => {
      return curr ? wire : null
    })
  }, [])

  // Apply loaded settings — runs only once after initial load completes
  useEffect(() => {
    if (isLoading) return
    if (settingsAppliedRef.current) return
    settingsAppliedRef.current = true

    if (!settings) {
      // If no settings was received add a default wire stream w/o filtering
      addStream()
      return
    }

    settings.content.forEach(({ uuid, type, meta }) => {
      if (type !== 'core/wire-pane') return

      const sections = meta.filter((meta) => meta.type === 'core/section').map((meta) => meta.uuid)
      const sources = meta.filter((meta) => meta.type === 'core/source').map((meta) => meta.uri)
      const texts = meta.filter((meta) => meta.type === 'query').map((meta) => meta.value)
      const newsvalues = meta.filter((meta) => meta.type === 'core/newsvalue').map((meta) => meta.value)

      addStream(uuid, {
        'core/section': sections,
        'core/source': sources,
        query: texts,
        'core/newsvalue': newsvalues
      })
    })

    requestAnimationFrame(() => {
      setIsDirty(false)
    })
  }, [isLoading, settings, addStream])

  // Track focus loss
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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

  const handleNavigation = useCallback((event: KeyboardEvent) => {
    if (
      event.getModifierState('Control')
      || event.getModifierState('Meta')
      || event.getModifierState('Alt')
    ) {
      return
    }

    switch (event.key) {
      case 'Escape':
        if (selectedWires.length > 0) {
          setSelectedWires([])
        } else if (previewWire) {
          setPreviewWire(null)
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
  }, [selectedWires, previewWire, onAction, onCreate])

  const viewRef = useNavigationKeysView({
    keys: ['Escape', 's', 'r', 'u', 'c'],
    onNavigation: handleNavigation
  })

  return (
    <View.Root ref={viewRef}>
      <ViewHeader.Root className='z-10'>
        <ViewHeader.Title title='Telegram' name='Wires' />

        <ViewHeader.Content>
          <WiresToolbar
            isDirty={!!isDirty}
            disabled={(selectedWires.length === 0 && !focusedWire) || isDirty === null}
            hasMissingFilters={REQUIRE_FILTERS && streams.some((s) => s.filters.length === 0)}
            onAddStream={addStream}
            onSaveStreams={onSaveStreams}
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
                  'rounded-lg grid shadow-xl border border-default-foreground/20 mx-1 justify-center',
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
