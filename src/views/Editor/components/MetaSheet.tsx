import { Story, Section, Byline, Newsvalue } from '@/components'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@ttab/elephant-ui'
import { PanelRightClose, PanelRightOpen } from '@ttab/elephant-ui/icons'
import { useState } from 'react'
import { AddNote } from './Notes/AddNote'
import { Version } from '@/components/Version'

export function MetaSheet({ container, documentId }: {
  container: HTMLElement | null
  documentId: string
}): JSX.Element {
  const [contentSource] = useYValue<string | undefined>('links.core/content-source[0].uri')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet onOpenChange={setIsOpen}>
      <SheetTrigger className='rounded-md  w-9 h-9 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700'>
        {!isOpen
          ? <PanelRightOpen size={18} strokeWidth={1.75} />
          : <PanelRightClose size={18} strokeWidth={1.75} />}
      </SheetTrigger>

      <SheetDescription />

      <SheetContent
        container={container}
        className='w-100vw h-100vh z-50 p-0 flex flex-col justify-between'
        defaultClose={false}
      >
        <div>
          <SheetHeader>
            <SheetTitle className='flex flex-row gap-4 justify-start justify-items-center items-center h-14 px-5 text-sm opacity-90'>
              <SheetClose className='rounded-md hover:bg-gray-100 w-9 h-9 flex items-center justify-center'>
                <PanelRightClose size={18} strokeWidth={1.75} />
              </SheetClose>
              <span className=' font-semibold'>
                Metadata
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className='flex flex-col gap-6 px-5 py-4 border-t'>

            <label className='text-xs text-muted-foreground -mb-3'>Versioner</label>
            <Version documentId={documentId} />

            <label className='text-xs text-muted-foreground -mb-3'>Egenskaper</label>
            <div className='flex flex-row gap-3'>
              <Newsvalue />
              <SluglineButton path='meta.tt/slugline[0].value' />
            </div>

            <label className='text-xs text-muted-foreground -mb-3'>Etiketter</label>
            <div className='flex flex-row gap-3'>
              <Story />
              <Section />
            </div>

            <label className='text-xs text-muted-foreground -mb-3'>Byline</label>
            <Byline />

            <label className='text-xs text-muted-foreground -mb-3'>Åtgärder</label>
            <div className='flex flex-row gap-3'>
              <AddNote text='Lägg till intern notering' variant='outline' />
            </div>

          </div>
        </div>

        <div className='flex flex-col gap-6 px-5 py-4 border-t'>
          <label className='text-xs text-muted-foreground -mb-3'>Extra information</label>
          <span className='font-thin text-muted-foreground text-xs'>{contentSource}</span>
        </div>
      </SheetContent>
    </Sheet>
  )
}
