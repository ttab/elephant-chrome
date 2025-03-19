import { useDocumentStatus, useView } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import { usePlanningAssigmentDeliverable } from '@/hooks/usePlanningAssigmentDeliverable'
import { getValueByYPath, setValueByYPath } from '@/lib/yUtils'


export const EditorHeader = ({ documentId }: { documentId: string }): JSX.Element => {
  const { viewId } = useView()
  const assignment = usePlanningAssigmentDeliverable(documentId)
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)
  const containerRef = useRef<HTMLElement | null>(null)
  const [publishTime, setPublishTime] = useState<Date | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  useEffect(() => {
    if (assignment?.assignment) {
      const [publish] = getValueByYPath<string>(assignment.assignment, 'data.publish')
      if (publish) {
        setPublishTime(new Date(publish))
      }
    }
  }, [assignment])

  // Callback to handle setStatus (withheld etc)
  const setArticleStatus = useCallback((newStatus: string, data?: Record<string, unknown>) => {
    if (!assignment) {
      // FIXME: Notify user that something is wrong in a nicer way
      alert('No planning or no article assignment links. Article not scheduled!')
      return
    }

    if (!(data?.time instanceof Date)) {
      // FIXME: Notify user that something is wrong in a nicer way
      alert('Faulty scheduled publish time set. Article not scheduled!')
      return
    }

    // FIXME: This is not correct
    setValueByYPath(assignment.assignment, 'data.publish', data.time.toISOString())

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
                <ViewHeader.RemoteUsers documentId={documentId} />

                {!!assignment && (
                  <StatusMenu
                    type='core/article'
                    status={documentStatus}
                    publishTime={publishTime || undefined}
                    setStatus={setArticleStatus}
                  />
                )}
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
