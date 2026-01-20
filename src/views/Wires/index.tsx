import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useCallback, useRef, useState, type JSX } from 'react'
import { useView } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import { Stream } from './components/Stream'
import { Button } from '@ttab/elephant-ui'
import { SaveIcon, PlusIcon } from '@ttab/elephant-ui/icons'
import { useStreamNavigation } from './hooks/useStreamNavigation'
import type { Wire } from '@/shared/schemas/wire'
import { Preview } from './components/Preview'
import { getWireStatus } from '@/components/Table/lib/getWireStatus'


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
  const selectedWires = useRef<Wire[]>([])

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

  const handleOnSelect = useCallback((wire: Wire, selected: boolean) => {
    if (selected) {
      selectedWires.current.push(wire)
    } else {
      selectedWires.current = selectedWires.current.filter((w) => w.id !== wire.id)
    }
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (!['s', 'r', 'u', 'Escape'].includes(event.key)) {
      return
    }

    if (event.key === 'Escape' && !preview) {
      // FIXME: Unselect selected stream entry components (how?)
      // FIXME: Selected wires must be part of a context maybe?
      selectedWires.current.length = 0
      return
    }

    const wires = [preview, ...selectedWires.current].filter((wire) => !!wire)
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
  }, [preview])

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

      <View.Content variant='no-scroll'>
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
                  onSelect={handleOnSelect}
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

      </View.Content>
    </View.Root>
  )
}

Wires.meta = meta
