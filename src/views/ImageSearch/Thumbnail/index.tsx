import { useRef } from 'react'
import { Preview } from '../Preview'
import { type ttninjs } from '@ttab/api-client'
import { Dialog, DialogContent, DialogTrigger } from '@ttab/elephant-ui'
import { findRenditionByUsageAndVariant } from '../lib/find-rendition'
import type { renditions } from '../lib/find-rendition'


const BASE_URL = import.meta.env.BASE_URL || ''

export const Thumbnail = ({ hit }: {
  hit: ttninjs
}): JSX.Element => {
  const imageRef = useRef<HTMLImageElement>(null)
  const renditions = hit.renditions as renditions
  const thumbnail = findRenditionByUsageAndVariant(renditions, 'Thumbnail', 'Normal')
  const preview = findRenditionByUsageAndVariant(renditions, 'Preview', 'Normal')
  const hires = findRenditionByUsageAndVariant(renditions, 'Hires', 'Normal')

  const id = new URL(preview.href).pathname.split('/').filter(Boolean).pop()
  const proxyUrl = `${BASE_URL}/api/images/${id}`

  return (
    <Dialog modal={false}>
      <DialogTrigger>
        <div className='flex place-content-center bg-gray-200 min-h-[144px]'>
          <img
            ref={imageRef}
            src={thumbnail.href}
            className='max-h-[176px] object-contain m-width-auto'
            onDragStartCapture={(e) => {
              e.stopPropagation()

              if (!imageRef.current) {
                return
              }

              // Create cloned element to force as drag image
              const el = imageRef.current
              const clone = el.cloneNode(true) as HTMLDivElement
              const { left, top } = el.getBoundingClientRect()

              clone.style.width = `${el.offsetWidth}px`
              clone.style.height = `${el.offsetHeight}px`

              document.body.appendChild(clone)

              el.style.opacity = '0.5'
              e.dataTransfer.clearData()

              const image = {
                byline: hit.byline ?? '',
                text: hit.description_text,
                href: preview.href,
                proxy: proxyUrl,
                width: hires.width,
                height: hires.height
              }

              e.dataTransfer.setData('tt/visual', JSON.stringify(image))
              e.dataTransfer.setDragImage(
                clone,
                (e.clientX - left) * 0.2,
                (e.clientY - top) * 0.2
              )
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
      <DialogContent><Preview ttninjs={hit} /></DialogContent>
    </Dialog>
  )
}
