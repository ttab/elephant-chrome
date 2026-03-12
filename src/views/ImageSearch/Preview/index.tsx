import type { ImageSearchHit } from '../lib/types'
import { DialogDescription, DialogHeader, DialogTitle } from '@ttab/elephant-ui'
import type { JSX } from 'react'

export const Preview = ({ hit }: {
  hit: ImageSearchHit
}): JSX.Element => {
  return (
    <div className='flex flex-col'>
      <div className='bg-muted flex items-center justify-center'>
        <img
          src={hit.previewUrl}
          className='max-h-[60vh] w-full object-contain'
        />
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
