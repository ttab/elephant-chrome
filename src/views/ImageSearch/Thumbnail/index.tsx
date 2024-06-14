import { useRef } from 'react'
import { Preview } from '../Preview'
import { ttninjs } from '@ttab/api-client'
import { Dialog, DialogContent, DialogTrigger } from '@ttab/elephant-ui'
import { findRenditionByUsageAndVariant, renditions } from '../fun/find-rendition'

interface ThumbnailProps {
  hit: ttninjs
}

export function Thumbnail(props: ThumbnailProps): JSX.Element {
  const imageRef = useRef<HTMLImageElement>(null)
  const { hit } = props
  const renditions = hit.renditions as renditions
  const thumbnail = findRenditionByUsageAndVariant(renditions, 'Thumbnail', 'Normal')
  const preview = findRenditionByUsageAndVariant(renditions, 'Preview', 'Watermark')

  return (
    <Dialog modal={false} >
      <DialogTrigger>
        <div className='flex place-content-center  bg-gray-200' style={{ minHeight: '144px' }}>
          <img
            // src={`${hit.uri}_NormalThumbnail.jpg`}
            src={thumbnail.href}
            // className='h-32 max-w-full'
            style={{ maxHeight: '176px', objectFit: 'contain', maxWidth: 'auto' }}
            onDragStartCapture={(e) => {
              console.log('dragging the image', e)
              const el = imageRef.current
              if (el) {
                // Create cloned element to force as drag image
                const clone = el.cloneNode(true) as HTMLDivElement
                const { left, top } = el.getBoundingClientRect()

                clone.style.width = `${el.offsetWidth}px`
                clone.style.height = `${el.offsetHeight}px`

                document.body.appendChild(clone)

                el.style.opacity = '0.5'
                e.dataTransfer.clearData()

                const image = {
                  byline: hit.byline,
                  text: hit.headline,
                  href: preview.href,
                  altText: hit?.description_text || ''
                }

                e.dataTransfer.setData('tt/visual-ex', JSON.stringify(image))
                e.dataTransfer.setDragImage(
                  clone,
                  (e.clientX - left) * 0.2,
                  (e.clientY - top) * 0.2
                )
              }
            }}

            onDragEndCapture={() => {
              const el = imageRef.current
              if (el) {
                el.style.opacity = '1'
              }
            }}
          />
        </div>
      </DialogTrigger>
      <DialogContent><Preview ttninjs={hit}/></DialogContent>
    </Dialog>


  )
}