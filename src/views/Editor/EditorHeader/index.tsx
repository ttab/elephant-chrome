import { useCollaboration, useView, useYValue } from '@/hooks'
import { NewsValueTimeDropDown } from './NewsValueTimeDropDown'
import { Newsvalue } from '@/components/Newsvalue'
import { useEffect, useRef } from 'react'
import { MetaSheet } from '../components/MetaSheet'

export const EditorHeader = (): JSX.Element => {
  const [duration, setDuration] = useYValue<string | undefined>('meta.core/newsvalue.data.duration')
  const [end, setEnd] = useYValue<string | undefined>('meta.core/newsvalue.data.end')

  const { viewId } = useView()
  const { synced } = useCollaboration()

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <div id={viewId} className='flex flex-row items-center'>
      <Newsvalue />
      <NewsValueTimeDropDown
        duration={typeof duration === 'string'
          ? duration
          : undefined}
        end={typeof end === 'string' ? end : undefined}
        loading={!synced}
        onChange={(newDuration, newEnd) => {
          if (newDuration && newEnd) {
            setDuration(newDuration)
            setEnd(newEnd)
          }
        }}
      />
      <MetaSheet container={containerRef.current} />
    </div>
  )
}
