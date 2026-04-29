import './print.css'
import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useCallback, useRef, useState, useMemo, type JSX, useEffect } from 'react'
import { useRegistry, useView, useNavigationKeys, useNavigationKeysWithRef, useQuery, useIsOnline } from '@/hooks'
import { useDocuments } from '@/hooks/index/useDocuments'
import { QueryV1, BoolQueryV1, TermsQueryV1 } from '@ttab/elephant-api/index'
import { fields as wireFields, type WireFields } from '@/shared/schemas/wire'
import { Button } from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'
import { cn } from '@ttab/elephant-ui/utils'
import { Stream } from './components/Stream'
import { StreamsBanner } from './components/StreamsBanner'
import { useStreamNavigation } from './hooks/useStreamNavigation'
import { useSavedFocus } from './hooks/useSavedFocus'
import type { Wire } from '@/shared/schemas/wire'
import { Preview } from './components/Preview'
import { WiresToolbar } from './components/WiresToolbar'
import { useWireViewState } from './hooks/useWireViewState'
import type { WireStatus } from './lib/setWireStatus'
import { calculateWireStatuses, executeWiresStatuses } from './lib/setWireStatus'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useModal } from '@/components/Modal/useModal'
import { WireCreation } from '@/views'
import { useSettings } from '@/modules/userSettings'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('wires')
  const { isActive } = useView()
  const { repository } = useRegistry()
  const { data: session } = useSession()
  const { showModal, hideModal } = useModal()
  const [, setQueryString] = useQuery()

  // Read id directly from the URL once on mount — useQuery wraps single values into arrays
  // and may not be ready before historyState loads.
  const [initialId] = useState<string | undefined>(
    () => new URLSearchParams(window.location.search).get('id') ?? undefined
  )

  const previewRestoredRef = useRef(false)
  const [previewWire, setPreviewWire] = useState<Wire | null>(null)
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [focusedWire, setFocusedWire] = useState<Wire | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { saveFocus, restoreFocus } = useSavedFocus()
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

  const isOnline = useIsOnline()
  const [streamErrors, setStreamErrors] = useState<Map<string, boolean>>(new Map())

  const handleStreamError = useCallback((streamId: string, hasError: boolean) => {
    setStreamErrors((prev) => {
      if (prev.get(streamId) === hasError) return prev
      const next = new Map(prev)
      if (hasError) {
        next.set(streamId, true)
      } else {
        next.delete(streamId)
      }
      return next
    })
  }, [])

  const streamErrorCount = useMemo(() => {
    let count = 0
    for (const hasError of streamErrors.values()) {
      if (hasError) count++
    }
    return count
  }, [streamErrors])

  const [selectedWires, setSelectedWires] = useState<Wire[]>([])
  const [statusMutations, setStatusMutations] = useState<WireStatus[]>([])
  const [failedMutationUuids, setFailedMutationUuids] = useState<ReadonlySet<string>>(new Set())

  // Fetch wire by ID from URL params to restore preview on load
  const initialWireQuery = useMemo(() => initialId
    ? QueryV1.create({
      conditions: {
        oneofKind: 'bool',
        bool: BoolQueryV1.create({
          must: [{
            conditions: {
              oneofKind: 'terms',
              terms: TermsQueryV1.create({ field: '_id', values: [initialId] })
            }
          }]
        })
      }
    })
    : undefined, [initialId])

  const { data: initialWireData } = useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    query: initialWireQuery,
    fields: wireFields,
    size: 1,
    disabled: !initialId
  })

  // Once the wire is fetched, restore the preview state (runs only once)
  useEffect(() => {
    if (previewRestoredRef.current || !initialWireData?.length) return
    previewRestoredRef.current = true
    setPreviewWire(initialWireData[0])
  }, [initialWireData])

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
                  case 'wireStatus':
                  case 'query':
                  case 'core/newsvalue':
                  case 'advancedSearch':
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
            title={t('settings.saveError')}
            description={details || error.message}
            primaryLabel={t('common:actions.close')}
            onPrimary={hideModal}
          />
        )
      } else {
        console.error('Failed to save wire settings:', error)
        showModal(
          <Prompt
            title={t('settings.saveError')}
            description={error instanceof Error ? error.message : t('settings.unknownError')}
            primaryLabel={t('common:actions.close')}
            onPrimary={hideModal}
          />
        )
      }
    }
  }, [streams, settings?.title, updateSettings, hideModal, showModal, t])

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
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current)
    previewDebounceRef.current = setTimeout(() => {
      setPreviewWire((curr) => curr ? wire : null)
    }, 150)
  }, [])

  // Sync preview wire id to URL query params
  useEffect(() => {
    if (previewWire) {
      setQueryString({ id: previewWire.id })
    } else {
      setQueryString({ id: undefined })
    }
    // Avoid circular dependency (recursive rerender) when changing location.
    // We specificially want to ignore setQueryString as dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewWire])

  // Apply loaded settings — runs only once after initial load completes
  useEffect(() => {
    if (isLoading) return
    if (settingsAppliedRef.current) return
    settingsAppliedRef.current = true

    if (!settings) {
      // If no settings was received add a default wire stream w/o filtering
      addStream()
      requestAnimationFrame(() => {
        setIsDirty(false)
      })
      return
    }

    settings.content.forEach(({ uuid, type, meta }) => {
      if (type !== 'core/wire-pane') return

      const knownTypes = new Set(['core/section', 'core/source', 'query', 'core/newsvalue', 'wireStatus', 'advancedSearch'])
      const filters = meta.filter((m) => m.role === 'filter')

      filters.forEach((m) => {
        if (!knownTypes.has(m.type)) {
          console.warn(`[Wires] Dropping unknown filter type "${m.type}" from stream ${uuid}`)
        }
      })

      const sections = filters.filter((m) => m.type === 'core/section').map((m) => m.uuid)
      const sources = filters.filter((m) => m.type === 'core/source').map((m) => m.uri)
      const texts = filters.filter((m) => m.type === 'query').map((m) => m.value)
      const newsvalues = filters.filter((m) => m.type === 'core/newsvalue').map((m) => m.value)
      const wireStatuses = filters.filter((m) => m.type === 'wireStatus').map((m) => m.value)
      const advancedSearch = filters.filter((m) => m.type === 'advancedSearch').map((m) => m.value)

      addStream(uuid, {
        'core/section': sections,
        'core/source': sources,
        query: texts,
        'core/newsvalue': newsvalues,
        wireStatus: wireStatuses,
        advancedSearch
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

  const handleRemoveStream = useCallback((streamId: string, wireIds: string[]) => {
    removeStream(streamId)
    setSelectedWires((prev) => prev.filter((w) => !wireIds.includes(w.id)))
  }, [removeStream])

  // Add or remove a wire from selectedWires
  const handleToggleWire = useCallback((wire: Wire, isSelected: boolean) => {
    setSelectedWires((prev) => {
      if (isSelected) {
        return (prev.some((w) => w.id === wire.id))
          ? prev
          : [...prev, wire]
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

    saveFocus()

    // Clear selected statuses and start mutations
    setStatusMutations(nextStatuses)
    setSelectedWires([])

    // Execute wire status changes and wait for completion.
    // Using setTimeout for to avoid the progress spinner to blink and disappear too quickly.
    void executeWiresStatuses(repository, session, nextStatuses).then((result) => {
      const failed = result.filter((r) => !r.statusSet).map((r) => r.uuid)

      if (failed.length) {
        // Signal rollback before clearing mutations so Stream can restore original fields
        setFailedMutationUuids(new Set(failed))
        toast.error(t('toast.statusChangeFailed'))
      }

      setTimeout(() => {
        setStatusMutations([])
        setFailedMutationUuids(new Set())
        restoreFocus()
      }, 100)
    }).catch((error: unknown) => {
      console.error('Unexpected error in executeWiresStatuses:', error)
      setStatusMutations([])
      setFailedMutationUuids(new Set())
    })
  }, [selectedWires, focusedWire, repository, session, previewWire, saveFocus, restoreFocus, t])

  // Create a new article based on selected wires
  const onCreate = useCallback(() => {
    if (!repository || !session) return

    const wires = selectedWires.length
      ? [...selectedWires]
      : focusedWire ? [focusedWire] : []

    saveFocus()
    showModal(
      <WireCreation
        onDialogClose={() => {
          hideModal()
          restoreFocus()
        }}
        asDialog
        wires={wires}
        onDocumentCreated={() => onAction('used')}
      />
    )
  }, [selectedWires, focusedWire, repository, session, showModal, hideModal, onAction, saveFocus, restoreFocus])

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

  // Escape is unconstrained so it fires regardless of where focus is within the page.
  // skipIfHandled defers to any capture-phase handler (e.g. modals).
  useNavigationKeys({
    keys: ['Escape'],
    onNavigation: handleNavigation,
    skipIfHandled: true
  })

  // Other shortcut keys are constrained to the view container to avoid
  // interfering with typing in other views
  const viewRef = useNavigationKeysWithRef({
    keys: ['s', 'r', 'u', 'c'],
    onNavigation: handleNavigation
  })

  return (
    <View.Root ref={viewRef}>
      <ViewHeader.Root className='z-10'>
        <ViewHeader.Title title={t('title')} name='Wires' />

        <ViewHeader.Content>
          <WiresToolbar
            isDirty={!!isDirty}
            disabled={(selectedWires.length === 0 && !focusedWire) || isDirty === null}
            hasMissingFilters={REQUIRE_FILTERS && streams.some((s) => s.filters.length === 0)}
            onAddStream={addStream}
            onSaveStreams={onSaveStreams}
            onAction={onAction}
            onCreate={onCreate}
          />
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content variant='no-scroll' className='relative'>
        <div
          data-wires-content
          className={cn(
            'h-full overflow-hidden @7xl/view:grid-cols-[auto_1fr]',
            previewWire && 'grid grid-rows-2 @7xl/view:grid-rows-1'
          )}
        >
          <div
            data-wires-streams
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
                  failedMutationUuids={failedMutationUuids}
                  onToggleWire={handleToggleWire}
                  onRemove={handleRemoveStream}
                  onFilterChange={setFilter}
                  onClearFilter={clearFilter}
                  previewWireId={previewWire?.id}
                  onPreviewWireUpdate={setPreviewWire}
                  focusedWireId={focusedWire?.id}
                  onFocusedWireUpdate={setFocusedWire}
                  isOnline={isOnline}
                  onStreamError={handleStreamError}
                />
              ))}
            </div>
          </div>

          {!!previewWire
            && (
              <div
                data-wires-preview
                className={cn(
                  'relative rounded-lg grid shadow-xl border border-default-foreground/20 mx-1',
                  'grid-cols-1 grid-rows-[auto_1fr] h-full overflow-hidden',
                  '@7xl/view:ml-0 @7xl/view:w-xl @7xl/view:my-2 @7xl/view:mx-0'
                )}
              >
                <Button
                  variant='ghost'
                  className='absolute top-1 right-4 z-10 w-9 h-9 px-0'
                  onMouseDown={(e) => { e.preventDefault() }}
                  onClick={(e) => {
                    e.preventDefault()
                    setPreviewWire(null)
                  }}
                >
                  <XIcon size={18} strokeWidth={1.75} />
                </Button>
                <Preview
                  wire={previewWire}
                  key={previewWire.id}
                />
              </div>
            )}
        </div>

        <StreamsBanner
          isOnline={isOnline}
          streamErrorCount={streamErrorCount}
          selectedWires={selectedWires}
        />
      </View.Content>
    </View.Root>
  )
}

Wires.meta = meta
