import type { ImageSearchHit } from '../lib/types'
import { DialogDescription, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import { ExternalLinkIcon } from '@ttab/elephant-ui/icons'
import type { JSX } from 'react'

export const Preview = ({ hit }: {
  hit: ImageSearchHit
}): JSX.Element => {
  return (
    <div className='flex flex-col'>
      <div className='relative bg-muted flex items-center justify-center'>
        <img
          src={hit.previewUrl}
          className='max-h-[60vh] max-w-full'
        />
        <a
          href={hit.previewUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='absolute right-2 bottom-2 rounded-full bg-background/80 backdrop-blur-sm p-1.5 shadow-sm hover:bg-background transition-colors'
        >
          <ExternalLinkIcon size={16} strokeWidth={1.75} />
        </a>
      </div>
      <div className='p-4 space-y-2'>
        <DialogHeader>
          <DialogTitle className='text-base leading-snug'>
            {hit.headline}
          </DialogTitle>
        </DialogHeader>
        {hit.description && (
          <DialogDescription className='overflow-auto max-h-40 text-sm text-muted-foreground'>
            {hit.description}
          </DialogDescription>
        )}
        {hit.byline && (
          <p className='text-xs text-muted-foreground'>
            {hit.byline}
          </p>
        )}
      </div>
    </div>
  )
}
