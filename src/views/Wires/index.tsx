import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useCallback, useRef, useState, useMemo, type JSX } from 'react'
import { useView } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import { Stream } from './components/Stream'
import { Button } from '@ttab/elephant-ui'
import { SaveIcon, PlusIcon } from '@ttab/elephant-ui/icons'
import { useStreamNavigation } from './hooks/useStreamNavigation'
import type { Wire } from '@/shared/schemas/wire'
import { Preview } from './components/Preview'
import { getWireStatus } from '@/components/Table/lib/getWireStatus'
import type { RowSelectionState, Updater } from '@tanstack/react-table'

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

export const Wires = (): JSX.Element => {
  const { isActive } = useView()
  const [preview, setPreview] = useState<Wire | null>(null)
  const [wireStreams, setWireStreams] = useState(['1', '2'])
  const containerRef = useRef<HTMLDivElement>(null)

  // Global row selection state for all streams
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Store wire data reference for selected rows
  const [wireDataMap, setWireDataMap] = useState<Map<string, Wire>>(new Map())

  useStreamNavigation({
    isActive,
    containerRef,
    wrapNavigation: false
  })

  const addWireStream = useCallback(() => {
    setWireStreams((curr) => {
      return [...curr, String(curr.length)]
    })
  }, [])

  const handleOnPress = useCallback((wire: Wire) => {
    setPreview(wire)
  }, [])

  const handleOnUnpress = useCallback(() => {
    setPreview(null)
  }, [])

  const handleOnFocus = useCallback((wire: Wire) => {
    setPreview((curr) => {
      return curr ? wire : null
    })
  }, [])

  // Handle data updates from streams
  const handleDataChange = useCallback((data: Wire[]) => {
    setWireDataMap((prev) => {
      const newMap = new Map(prev)
      data.forEach((wire) => {
        newMap.set(wire.id, wire)
      })
      return newMap
    })
  }, [])

  // Update wire data map when selection changes - properly typed
  const handleRowSelectionChange = useCallback((updater: Updater<RowSelectionState>) => {
    setRowSelection(updater)
  }, [])

  // Get selected wires from selection state
  const selectedWires = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((id) => rowSelection[id])
      .map((id) => wireDataMap.get(id))
      .filter((wire): wire is Wire => wire !== undefined)
  }, [rowSelection, wireDataMap])

  // Clear all selections
  const clearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (!['s', 'r', 'u', 'Escape'].includes(event.key)) {
      return
    }

    if (event.key === 'Escape' && !preview) {
      clearSelection()
      return
    }

    const wires = [preview, ...selectedWires].filter((wire): wire is Wire => !!wire)
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
  }, [preview, selectedWires, clearSelection])

  return (
    <View.Root>
      <ViewHeader.Root>
        <ViewHeader.Title title='Telegram' name='Wires' />
        <ViewHeader.Content>
          <div className='flex'>
            <Button variant='ghost' className='w-9 h-9 px-0' onClick={addWireStream}>
              <PlusIcon strokeWidth={1.75} size={18} />
            </Button>
            <Button variant='ghost' disabled={true} className='w-9 h-9 px-0' onClick={() => {}}>
              <SaveIcon strokeWidth={1.75} size={18} />
            </Button>
          </div>
        </ViewHeader.Content>
        <ViewHeader.Action />
      </ViewHeader.Root>

      <View.Content variant='no-scroll' className='relative'>
        <div
          className={cn(
            'h-full overflow-hidden @7xl/view:grid-cols-[auto_1fr]',
            preview && 'grid grid-rows-2 @7xl/view:grid-rows-1'
          )}
          onKeyDown={handleKeyDown}
        >
          <div
            className={cn(
              'h-full overflow-x-auto overflow-y-hidden',
              preview && '@7xl/view:pr-2'
            )}
          >
            {/* Grid */}
            <div ref={containerRef} className='grid h-full snap-x snap-proximity overflow-x-auto overflow-hidden grid-flow-col auto-cols-max'>
              {wireStreams.map((wireStream) => (
                <Stream
                  key={wireStream}
                  streamId={wireStream}
                  wireStream={wireStream}
                  onPress={handleOnPress}
                  onUnpress={handleOnUnpress}
                  onFocus={handleOnFocus}
                  rowSelection={rowSelection}
                  onRowSelectionChange={handleRowSelectionChange}
                  onDataChange={handleDataChange}
                />
              ))}
            </div>
          </div>

          {!!preview
            && (
              <div
                className={cn(
                  'rounded-lg grid shadow-xl border border-default-foreground/20 mx-0.5',
                  'grid-rows-[auto_1fr]',
                  '@7xl/view:ml-0 @7xl/view:w-xl @7xl/view:my-0.5 @7xl/view:mx-0'
                )}
              >
                <Preview
                  wire={preview}
                  onClose={() => setPreview(null)}
                />
              </div>
            )}
        </div>

        {selectedWires.length > 0 && (
          <div className='absolute bottom-4 left-0 right-0 flex justify-center items-center z-50'>
            <div className='border bg-background rounded-lg text-sm px-5 py-3 shadow-lg flex flex-col items-center gap-1'>
              <div className='flex flex-row items-center gap-2'>
                <div className='overflow-hidden truncate max-w-130'>
                  {`${selectedWires[0].fields['document.title']?.values[0]}`}
                </div>

                {selectedWires.length > 1 && (
                  <div className='bg-muted px-2 py-0.5 rounded-md text-xs'>
                    +
                    {selectedWires.length - 1}
                  </div>
                )}
              </div>
              <div className='text-center text-muted-foreground text-xs'>
                <span className='bg-muted px-2 py-0.5 rounded-md text-xs font-semibold'>ESC</span>
                {' '}
                <span>för att ta avmarkera valda telegram</span>
              </div>
            </div>
          </div>
        )}
      </View.Content>
    </View.Root>
  )
}

Wires.meta = meta
