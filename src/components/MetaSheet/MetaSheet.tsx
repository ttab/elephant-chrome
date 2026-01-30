import { Story, Section, Byline, Newsvalue } from '@/components'
import { SluglineButton } from '@/components/DataItem/Slugline'
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
import { useYValue, type YDocument } from '@/modules/yjs/hooks'
import { PanelRightCloseIcon, PanelRightOpenIcon } from '@ttab/elephant-ui/icons'
import { useState, type JSX } from 'react'
import { AddNote } from '@/components/Notes/AddNote'
import { Version } from '@/components/Version'
import { ReadOnly } from './ReadOnly'
import { EditorialInfoTypes } from '@/components/EditorialInfoTypes'
import { ContentSource } from '@/components/ContentSource'
import type * as Y from 'yjs'
import { useTranslation } from 'react-i18next'

export function MetaSheet({ container, ydoc, readOnly, readOnlyVersion }: {
  container: HTMLElement | null
  ydoc: YDocument<Y.Map<unknown>>
  readOnly?: boolean
  readOnlyVersion?: bigint
}): JSX.Element {
  const [documentType] = useYValue<string | undefined>(ydoc.ele, 'root.type')
  const [slugline] = useYValue<string | undefined>(ydoc.ele, 'meta.tt/slugline[0].value')
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('metaSheet')

  return (
    <Sheet onOpenChange={setIsOpen}>
      <SheetTrigger className='rounded-md  w-9 h-9 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-table-focused'>
        {!isOpen
          ? <PanelRightOpenIcon size={18} strokeWidth={1.75} />
          : <PanelRightCloseIcon size={18} strokeWidth={1.75} />}
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
                <PanelRightCloseIcon size={18} strokeWidth={1.75} />
              </SheetClose>
              <span className=' font-semibold'>
                {t('title')}
              </span>
            </SheetTitle>
          </SheetHeader>
          {readOnly
            ? <ReadOnly documentId={ydoc.id} version={readOnlyVersion} />
            : (
                <div className='flex flex-col gap-6 px-5 py-4 border-t'>

                  {documentType === 'core/article' && (
                    <>
                      <Label htmlFor='properties' className='text-xs text-muted-foreground -mb-3'>{t('labels.properties')}</Label>
                      <div className='flex flex-row gap-3' id='properties'>
                        <Newsvalue ydoc={ydoc} path='meta.core/newsvalue[0].value' />
                        <SluglineButton value={slugline} />
                      </div>

                      <Label htmlFor='tags' className='text-xs text-muted-foreground -mb-3'>{t('labels.tags')}</Label>
                      <div className='flex flex-row gap-3' id='tags'>
                        <Story ydoc={ydoc} path='links.core/story[0]' asSubject />
                        <Section ydoc={ydoc} path='links.core/section[0]' />
                      </div>

                      <Label htmlFor='byline' className='text-xs text-muted-foreground -mb-3'>{t('labels.byline')}</Label>
                      <div id='byline'>
                        <Byline ydoc={ydoc} path='links.core/author' />
                      </div>

                      <Label htmlFor='actions' className='text-xs text-muted-foreground -mb-3'>{t('labels.actions')}</Label>
                      <div className='flex flex-row gap-3' id='actions'>
                        <AddNote ydoc={ydoc} text={t('actions.addNote')} />
                      </div>

                      <Label htmlFor='content-source'>{t('labels.contentSource')}</Label>
                      <div id='content-source'>
                        <ContentSource ydoc={ydoc} path='links.core/content-source' />
                      </div>
                    </>
                  )}

                  <Label htmlFor='version' className='text-xs text-muted-foreground -mb-3'>{t('labels.versions')}</Label>
                  <div id='version'>
                    <Version documentId={ydoc.id} textOnly={false} />
                  </div>

                  {documentType === 'core/editorial-info' && (
                    <>
                      <Label htmlFor='editorial-info-type'>{t('labels.editorialInfoType')}</Label>
                      <div id='editorial-info-type'>
                        <EditorialInfoTypes ydoc={ydoc} />
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
