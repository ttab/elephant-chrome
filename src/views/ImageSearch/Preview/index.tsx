import { type ttninjs } from '@ttab/api-client'
import { DialogDescription, DialogTitle } from '@ttab/elephant-ui'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.BASE_URL || ''

export const Preview = ({ ttninjs }: {
  ttninjs: ttninjs
}): JSX.Element => {
  const id = new URL(ttninjs.uri).pathname.split('/').filter(Boolean).pop()

  if (!id) {
    console.error('No id found in ttninjs.uri')
    toast.error('Kan inte visa bild, ogiltigt id')
  }

  const mediaType = ttninjs.type === 'graphic' ? 'graphics' : 'images'

  const url = `${BASE_URL}/api/${mediaType}/${id}_NormalPreview.jpg`

  return (
    <div className='flex flex-col'>
      <DialogTitle className='pb-2'>{ttninjs.headline}</DialogTitle>
      <img
        src={url}
      />
      <DialogDescription className='overflow-auto max-h-56 pt-2 text-foreground'>
        {ttninjs.description_text}
      </DialogDescription>
    </div>
  )
}
