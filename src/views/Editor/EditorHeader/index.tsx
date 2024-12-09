import { useView } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useEffect, useRef } from 'react'
import { MetaSheet } from '../components/MetaSheet'

export const EditorHeader = (): JSX.Element => {
  const { viewId } = useView()

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  return (
    <div className='flex flex-row items-center'>
      <Newsvalue />
      <MetaSheet container={containerRef.current} />
    </div>
  )
}
