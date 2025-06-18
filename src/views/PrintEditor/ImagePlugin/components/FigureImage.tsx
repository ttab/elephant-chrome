import type { Repository } from '@/shared/Repository'
import type { AttachmentDetails } from '@ttab/elephant-api/repository'
import { TextbitElement, type Plugin } from '@ttab/textbit'
import { useEffect, useRef, useState } from 'react'
// import { Element } from 'slate'

/*
 * Render a "handout" image using a retreived signed download url.
 */
export const FigureImage = ({ children, rootNode, options }: Plugin.ComponentProps & {
  options: {
    repository: Repository
    accessToken: string
  }
}): JSX.Element => {
  // const { properties = {} } = Element.isElement(rootNode) ? rootNode : {}
  console.log(' :15 ~ children', children)
  console.log(' :15 ~ rootNode', rootNode)
  const { properties = {} } = TextbitElement.isBlock(rootNode) ? rootNode : {}
  console.log(' :17 ~ properties', properties)
  const src: string = properties?.src as string || ''
  const imgContainerRef = useRef<HTMLDivElement>(null)
  console.log(' :23 ~ imgContainerRef', imgContainerRef)
  const [attachmentDetails, setAttachmentDetails] = useState<AttachmentDetails | null>(null)
  console.log(' :24 ~ attachmentDetails', attachmentDetails)

  useEffect(() => {
    const { repository: repository, accessToken } = options
    console.log(' :28 ~ useEffect ~ repository', repository)
    if (!repository || !accessToken) {
      return
    }

    // FIXME: Ensure this works
    console.log('running getattachmentdetails')
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
