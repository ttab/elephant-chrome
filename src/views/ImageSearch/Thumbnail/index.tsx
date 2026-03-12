import { useRef, type JSX, useState } from 'react'
import { Preview } from '../Preview'
import type { ImageSearchHit } from '../lib/types'
import { Dialog, DialogClose, DialogContent } from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'


export const Thumbnail = ({ hit }: {
  hit: ImageSearchHit
}): JSX.Element => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div
        className='flex place-content-center bg-gray-200 dark:bg-table-focused min-h-[144px] rounded-sm overflow-hidden cursor-pointer'
        onClick={() => setIsOpen(true)}
      >
        <img
          ref={imageRef}
          src={hit.thumbnailUrl}
          title={hit.description}
          className='max-h-[176px] object-contain m-width-auto'
          onDragStartCapture={(e) => {
            e.stopPropagation()

            if (!imageRef.current) {
              return
            }

            // Create cloned element to force as drag image
            const el = imageRef.current
            const clone = el.cloneNode(true) as HTMLImageElement
            clone.dataset.dragClone = ''
            const { left, top } = el.getBoundingClientRect()

            clone.style.width = `${el.offsetWidth}px`
            clone.style.height = `${el.offsetHeight}px`
            clone.style.background = `url('${hit.thumbnailUrl}')`

            el.style.opacity = '0.5'
            e.dataTransfer.clearData()

            const image = {
              uri: hit.uri,
              rel: hit.linkRel,
              type: hit.linkType,
              byline: hit.byline,
              text: hit.description,
              href: hit.originalUrl,
              proxy: hit.previewUrl,
              width: hit.hiresWidth,
              height: hit.hiresHeight
            }

            e.dataTransfer.setData(hit.dragMimeType, JSON.stringify(image))
            e.dataTransfer.setDragImage(
              clone,
              (e.clientX - left) * 0.2,
              (e.clientY - top) * 0.2
            )
            document.body.appendChild(clone)
          }}
          onDragEndCapture={() => {
            const el = imageRef.current
            if (el) {
              el.style.opacity = '1'
            }
            document.querySelectorAll('img[data-drag-clone]')
              .forEach((clone) => clone.remove())
          }}
        />
      </div>
      <DialogContent className='z-50 gap-0 p-0 overflow-hidden max-w-3xl'>
        <DialogClose className='absolute right-3 top-3 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1.5 shadow-sm hover:bg-background transition-colors'>
          <XIcon size={16} strokeWidth={1.75} />
          <span className='sr-only'>Stäng</span>
        </DialogClose>
        <Preview hit={hit} />
      </DialogContent>
    </Dialog>
  )
}
