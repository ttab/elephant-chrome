import { type ttninjs } from '@ttab/api-client'
import { DialogDescription, DialogTitle } from '@ttab/elephant-ui'
import { toast } from 'sonner'
import { useEffect, useRef, type Dispatch, type JSX, type SetStateAction } from 'react'
import { XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const BASE_URL = import.meta.env.BASE_URL || ''

export const Preview = ({ ttninjs, setOpen }: {
  ttninjs: ttninjs
  setOpen: Dispatch<SetStateAction<boolean>>
}): JSX.Element => {
  const id = new URL(ttninjs.uri).pathname.split('/').filter(Boolean).pop()
  const previewRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (previewRef.current && !previewRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [setOpen])


  if (!id) {
    console.error('No id found in ttninjs.uri')
    toast.error(t('views:imageSearch.errors.showPictureError'))
  }

  const mediaType = ttninjs.type === 'graphic' ? 'graphics' : 'images'

  const url = `${BASE_URL}/api/${mediaType}/${id}_NormalPreview.jpg`

  return (
    <div className='flex flex-col' ref={previewRef}>
      <div className='flex items-center justify-between'>
        <DialogTitle className='pb-2'>{ttninjs.headline}</DialogTitle>
        <div className='cursor-pointer hover:bg-slate-200 dark:hover:bg-table-focused p-2 rounded-md' onClick={() => setOpen((prev) => !prev)}>
          <XIcon size={16} strokeWidth={1.75} className='text-black dark:text-white' />
        </div>
      </div>
      <img
        src={url}
      />
      <DialogDescription className='overflow-auto max-h-56 pt-2 text-foreground'>
        {ttninjs.description_text}
      </DialogDescription>
    </div>
  )
}
