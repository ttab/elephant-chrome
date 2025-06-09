import { TextbitElement, type Plugin } from '@ttab/textbit'
import { useEffect, useRef } from 'react'

export const FigureImage = ({ children, rootNode }: Plugin.ComponentProps): JSX.Element => {
  const { properties = {} } = TextbitElement.isBlock(rootNode) ? rootNode : {}
  const src: string = properties?.src as string || ''
  const imgContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imgContainerRef?.current) {
      return
    }
    imgContainerRef.current.classList.remove('appear-dimmed')
  }, [])

  return (
    <div contentEditable={false} draggable={false}>
      <div ref={imgContainerRef} className='rounded rounded-xs overflow-hidden'>
        <img width='100%' src={src} />
      </div>
      {children}
    </div>
  )
}
