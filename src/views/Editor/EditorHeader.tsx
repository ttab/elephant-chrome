import { useDocumentStatus, useView } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useEffect, useRef } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { DocumentStatusMenu } from '@/components/DocumentStatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'

export const EditorHeader = ({ documentId }: { documentId: string }): JSX.Element => {
  const { viewId } = useView()
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)

  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])


  return (
    <ViewHeader.Root>
      <ViewHeader.Title name='Editor' title='Editor' icon={PenBoxIcon} />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[810px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @lg/view:flex'>
              <Newsvalue />
              <AddNote />
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!documentId && (
              <>
                <DocumentStatusMenu type='core/article' status={documentStatus} setStatus={setDocumentStatus} />
                <ViewHeader.RemoteUsers documentId={documentId} />
              </>
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action>
        <MetaSheet container={containerRef.current} />
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
