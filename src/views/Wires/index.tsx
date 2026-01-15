import { View, ViewHeader } from '@/components/View'
import { type ViewMetadata } from '@/types/index'
import { useCallback, useRef, useState, type JSX } from 'react'
import { useView } from '@/hooks'
import { cn } from '@ttab/elephant-ui/utils'
import { Stream } from './components/Stream'
import { Button, ButtonGroup } from '@ttab/elephant-ui'
import { SaveIcon, PlusIcon } from '@ttab/elephant-ui/icons'
import { useStreamNavigation } from './hooks/useStreamNavigation'


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
  const { viewId, isActive, isFocused } = useView()
  const [preview, setPreview] = useState<boolean>(false)
  const [wireStreams, setWireStreams] = useState(['1', '2'])
  const containerRef = useRef<HTMLDivElement>(null)

  useStreamNavigation({
    isActive: isActive && isFocused,
    containerRef,
    wrapNavigation: false
  })

  const addWireStream = useCallback(() => {
    setWireStreams((curr) => {
      return [...curr, String(curr.length)]
    })
  }, [])

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
                <Stream key={wireStream} streamId={wireStream} wireStream={wireStream} />
              ))}
            </div>
          </div>
        </div>

      </View.Content>
    </View.Root>
  )
}

Wires.meta = meta
