import type { Repository } from '@/shared/Repository'
import type { AttachmentDetails } from '@ttab/elephant-api/repository'
import { TextbitElement, type Plugin } from '@ttab/textbit'
import { useEffect, useRef, useState } from 'react'

/*
 * Render a "handout" image using a retreived signed download url.
 */
export const FigureImage = ({ children, rootNode, options }: Plugin.ComponentProps & {
  options: {
    repository: Repository
    accessToken: string
  }
}): JSX.Element => {
  const { properties = {} } = TextbitElement.isBlock(rootNode) ? rootNode : {}
  const src: string = properties?.src as string || ''
  const imgContainerRef = useRef<HTMLDivElement>(null)
  const [attachmentDetails, setAttachmentDetails] = useState<AttachmentDetails | null>(null)

  useEffect(() => {
    const { repository: repository, accessToken } = options
    if (!repository || !accessToken) {
      return
    }

    // FIXME: Ensure this works
    repository.getAttachmentDetails(rootNode.id, accessToken)
      .then(setAttachmentDetails)
      .catch((ex) => {
        console.error(ex)
      })
  }, [options, rootNode])

  useEffect(() => {
    if (!attachmentDetails) {
      return
    }

    if (!imgContainerRef?.current) {
      return
    }
    imgContainerRef.current.classList.remove('appear-dimmed')
  }, [attachmentDetails])

  return (
    <div contentEditable={false} draggable={false}>
      <div ref={imgContainerRef} className='rounded rounded-xs overflow-hidden'>
        <img width='100%' src={src} />
      </div>
      {children}
    </div>
  )
}
