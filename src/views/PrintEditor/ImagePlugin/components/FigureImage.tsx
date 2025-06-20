import type { Repository } from '@/shared/Repository'
import type { AttachmentDetails } from '@ttab/elephant-api/repository'
import { type TBElement, TextbitElement, type Plugin } from '@ttab/textbit'
import { useEffect, useRef, useState } from 'react'

/**
 * Render a "handout" image using a retreived signed download url.
 */

export const FigureImage = ({ children, rootNode, options }: Plugin.ComponentProps & {
  options: {
    repository: Repository
    accessToken: string
  }
}): JSX.Element => {
  const { properties = {} } = TextbitElement.isBlock(rootNode) ? rootNode as TBElement : {}

  const { repository: repository, accessToken } = options
  const { uploadId }: { uploadId?: string } = properties
  const imgContainerRef = useRef<HTMLDivElement>(null)
  const [attachmentDetails, setAttachmentDetails] = useState<AttachmentDetails | null>(null)

  useEffect(() => {
    if (!repository || !accessToken || !uploadId) {
      return
    }

    if (!imgContainerRef?.current) {
      return
    }

    repository.getAttachmentDetails(uploadId, accessToken)
      .then((details) => {
        setAttachmentDetails(details)
      })
      .catch((ex) => {
        console.error(ex)
      })
  }, [accessToken, repository, uploadId])

  return (
    <div contentEditable={false} draggable={false}>
      <div ref={imgContainerRef} className='rounded rounded-xs overflow-hidden'>
        <img width='100%' src={attachmentDetails?.downloadLink} />
      </div>
      {children}
    </div>
  )
}
