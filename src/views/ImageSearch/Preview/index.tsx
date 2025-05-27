import { type ttninjs } from '@ttab/api-client'
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
      <div>
        <h3>{ttninjs.headline}</h3>
      </div>
      <img
        src={url}
      />
      <div className='overflow-auto max-h-56'>{ttninjs.description_text}</div>
    </div>
  )
}
