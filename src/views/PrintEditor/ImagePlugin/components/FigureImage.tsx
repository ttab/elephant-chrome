import type { Repository } from '@/shared/Repository'
import type { AttachmentDetails } from '@ttab/elephant-api/repository'
import { type TBElement, TextbitElement, type Plugin } from '@ttab/textbit'
import { Crop } from '@ttab/textbit-plugins'
import { useEffect, useRef, useState } from 'react'
import type { Editor } from 'slate'
import { Transforms, type Descendant } from 'slate'
import { parseCropString, parseFocusString } from '../lib/utils'

/**
 * Render a "handout" image using a retreived signed download url.
 */

export const FigureImage = ({ editor, children, rootNode, options }: Plugin.ComponentProps & {
  options: {
    repository: Repository
    accessToken: string
  }
}): JSX.Element => {
  const { properties = {} } = TextbitElement.isBlock(rootNode) ? rootNode as TBElement : {}

  const focusStr = properties?.focus as string || undefined
  const cropStr = properties?.crop as string || undefined
  const crop = parseCropString(cropStr)
  const focus = parseFocusString(focusStr)

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
      <div ref={imgContainerRef} className='relative rounded rounded-xs overflow-hidden'>
        <img width='100%' src={attachmentDetails?.downloadLink} />

        {!!attachmentDetails?.downloadLink
        && (
          <>
            {/* Overlay with cutout for crop area */}
            {crop && <Crop.VisualCrop crop={crop} />}

            {/* Focus point indicator */}
            {focus && <Crop.VisualFocus focus={focus} />}

            <Crop.Dialog
              src={attachmentDetails?.downloadLink}
              area={crop}
              point={focus}
              onChange={({ crop, focus }) => {
                // @ts-expect-error Fix needed in Textbit to handle type better
                const n = editor.children.findIndex((child: Descendant) => child.id === rootNode?.id)
                if (n < 0) {
                  return
                }

                // Convert back to string format for storage
                const cropString = crop ? `${crop.x} ${crop.y} ${crop.w} ${crop.h}` : undefined
                const focusString = focus ? `${focus.x} ${focus.y}` : undefined

                Transforms.setNodes(
                  editor as Editor,
                  {
                    // @ts-expect-error Fix needed in Textbit to handle type better
                    properties: {
                      ...rootNode.properties,
                      crop: cropString,
                      focus: focusString
                    }
                  },
                  { at: [n] }
                )
              }}
            />
          </>
        )}
      </div>
      {children}
    </div>
  )
}
