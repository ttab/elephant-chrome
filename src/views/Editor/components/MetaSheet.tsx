import { Story, Section, Byline, Newsvalue } from '@/components'
import { SluglineButton } from '@/components/DataItem/Slugline'
import { useYValue } from '@/hooks/useYValue'
import {
  Label,
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
import { ReadOnly } from './ReadOnly'
import { EditorialInfoTypes } from '@/components/EditorialInfoTypes'
import { ContentSource } from '@/components/ContentSource'

export function MetaSheet({ container, documentId, readOnly, readOnlyVersion }: {
  container: HTMLElement | null
  documentId: string
  readOnly?: boolean
  readOnlyVersion?: bigint
}): JSX.Element {
  const [documentType] = useYValue<string | undefined>('root.type')
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
          {readOnly
            ? <ReadOnly documentId={documentId} version={readOnlyVersion} />
            : (
                <div className='flex flex-col gap-6 px-5 py-4 border-t'>

                  <Label htmlFor='properties' className='text-xs text-muted-foreground -mb-3'>Egenskaper</Label>
                  <div className='flex flex-row gap-3' id='properties'>
                    <Newsvalue />
                    <SluglineButton path='meta.tt/slugline[0].value' />
                  </div>

                  <Label htmlFor='tags' className='text-xs text-muted-foreground -mb-3'>Etiketter</Label>
                  <div className='flex flex-row gap-3' id='tags'>
                    <Story asSubject />
                    <Section />
                  </div>

                  <Label htmlFor='byline' className='text-xs text-muted-foreground -mb-3'>Byline</Label>
                  <div id='byline'>
                    <Byline />
                  </div>

                  <Label htmlFor='actions' className='text-xs text-muted-foreground -mb-3'>Åtgärder</Label>
                  <div className='flex flex-row gap-3' id='actions'>
                    <AddNote text='Lägg till intern notering' variant='outline' />
                  </div>

                  <Label htmlFor='version' className='text-xs text-muted-foreground -mb-3'>Versioner</Label>
                  <div id='version'>
                    <Version documentId={documentId} textOnly={false} />
                  </div>

                  <Label htmlFor='content-source'>Källor andra än TT</Label>
                  <div id='content-source'>
                    <ContentSource />
                  </div>

                  {documentType === 'core/editorial-info' && (
                    <>
                      <Label htmlFor='editorial-info-type'>Redaktionell info, typ</Label>
                      <div id='editorial-info-type'>
                        <EditorialInfoTypes />
                      </div>
                    </>
                  )}
                </div>
              )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
