import { useDocumentStatus, useView } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, useEffect, useRef } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import { usePlanningAssigmentDeliverable } from '@/hooks/usePlanningAssigmentDeliverable'


export const EditorHeader = ({ documentId }: { documentId: string }): JSX.Element => {
  const { viewId } = useView()
  const assignment = usePlanningAssigmentDeliverable(documentId)
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])



  // Callback to handle setStatus (withheld etc)
  const setArticleStatus = useCallback((newStatus: string, data?: Record<string, unknown>) => {
    if (assignment) {
      // FIXME: Notify user that something is wrong
      alert('No planning or no article assignment links. Failed setting status!')
      return
    }

    if (typeof data?.foo === 'string') {
      void setDocumentStatus(newStatus)
    }
  }, [assignment, setDocumentStatus])


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
                <StatusMenu type='core/article' status={documentStatus} setStatus={setArticleStatus} />
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
