import { useView } from '@/hooks'
import { useEffect, useRef } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { RefreshCw, PenBoxIcon } from '@ttab/elephant-ui/icons'
import { Button } from '@ttab/elephant-ui'

export const EditorHeader = ({
  documentId
}: {
  documentId: string
}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = document.getElementById(viewId)
  }, [viewId])


  return (
    <ViewHeader.Root className='grid grid-cols-3'>
      <section className='col-span-2 flex flex-row gap-2 justify-between items-center w-full'>
        <ViewHeader.Title name='TV-bilagor' title='TV-bilagor' icon={PenBoxIcon} />

        <ViewHeader.Content className='justify-start w-full'>
          <div className='max-w-[1040px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
            <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
              <div className='hidden flex-row gap-2 justify-start items-center @lg/view:flex'>
                <input type='text' placeholder='Printartikelnamn' className='px-2 py-1' />
                <AddNote />
              </div>
            </div>

            <div className='flex flex-row gap-2 justify-end items-center'>
              {!!documentId && (
                <>
                  <ViewHeader.RemoteUsers documentId={documentId} />
                  <StatusMenu
                    documentId={documentId}
                    type='core/article'
                  />
                </>
              )}
            </div>
          </div>
        </ViewHeader.Content>
      </section>
      <section className='col-span-1 flex items-center justify-between flex-row gap-2 w-full'>
        <Button
          title='Rendera om alla layouter.'
          variant='outline'
          size='sm'
          className='px-2 py-0 flex gap-2 items-center'
          onClick={(e) => {
            e.preventDefault()
            window.alert('Ej implementerat')
          }}
        >
          <RefreshCw strokeWidth={1.75} size={16} />
          Uppdatera alla
        </Button>
        <ViewHeader.Action>
          <MetaSheet container={containerRef.current} documentId={documentId} />
        </ViewHeader.Action>
      </section>
    </ViewHeader.Root>
  )
}
