import { useView } from '@/hooks'
import { useEffect, useRef, type JSX } from 'react'
import { ViewHeader } from '@/components/View'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import { AddNote } from '@/components/Notes/AddNote'
import { ArticleTitle } from './components/ArticleTitle'
import type * as Y from 'yjs'
import type { YDocument } from '@/modules/yjs/hooks'

export const EditorHeader = ({
  ydoc,
  flowName
}: {
  ydoc: YDocument<Y.Map<unknown>>
  flowName?: string
}): JSX.Element => {
  const { viewId } = useView()
  const containerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    containerRef.current = window.document.getElementById(viewId)
  }, [viewId])

  return (
    <ViewHeader.Root className='@container grid grid-cols-2'>
      <section className='col-span-2 flex flex-row gap-2 justify-between items-center w-full'>
        <ViewHeader.Title name={flowName || ''} title={flowName || ''} icon={PenBoxIcon} />

        <ViewHeader.Content className='justify-start w-full'>
          <div className='max-w-[1040px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
            <ArticleTitle ydoc={ydoc} />
            <div className='flex flex-row gap-2 justify-end items-center'>
              <AddNote ydoc={ydoc} role='internal' />
              {!!ydoc.id && (
                <>
                  <ViewHeader.RemoteUsers ydoc={ydoc} />
                  <StatusMenu
                    ydoc={ydoc}
                    type='tt/print-article'
                  />
                </>
              )}
            </div>
          </div>
        </ViewHeader.Content>
        <ViewHeader.Action>
        </ViewHeader.Action>
      </section>
    </ViewHeader.Root>
  )
}
