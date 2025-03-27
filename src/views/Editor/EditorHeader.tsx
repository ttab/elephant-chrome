import { useDocumentStatus, useView } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon } from '@ttab/elephant-ui/icons'
import { useDeliverablePlanning } from '@/hooks/useDeliverablePlanning'
import { getValueByYPath, setValueByYPath } from '@/lib/yUtils'
import type { EleBlock } from '@/shared/types'


export const EditorHeader = ({ documentId }: { documentId: string }): JSX.Element => {
  const { viewId } = useView()
  const deliverablePlanning = useDeliverablePlanning(documentId)
  const [documentStatus, setDocumentStatus] = useDocumentStatus(documentId)
  const containerRef = useRef<HTMLElement | null>(null)
  const [publishTime, setPublishTime] = useState<string | null>(null)

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])


  useEffect(() => {
    if (deliverablePlanning) {
      const { index } = deliverablePlanning.getAssignment()
      const [ass] = getValueByYPath<EleBlock>(deliverablePlanning.yRoot, `meta.core/assignment[${index}]`)

      if (ass) {
        setPublishTime((prev) => (ass.data.publish !== prev) ? ass.data.publish : prev)
      }
    }
  }, [deliverablePlanning])


  // Callback to handle setStatus (withheld etc)
  const setArticleStatus = useCallback((newStatus: string, data?: Record<string, unknown>) => {
    if (!deliverablePlanning) {
      // FIXME: Notify user that something is wrong in a nicer way
      alert('No planning or no article assignment links. Article not scheduled!')
      return
    }

    const { index } = deliverablePlanning.getAssignment()
    if (index > -1) {
      if (newStatus === 'withheld') {
        if (!(data?.time instanceof Date)) {
          // FIXME: Notify user that something is wrong in a nicer way
          alert('Faulty scheduled publish time set. Article not scheduled!')
          return
        }
        setValueByYPath(deliverablePlanning.yRoot, `meta.core/assignment[${index}].data.publish`, data.time.toISOString())
      }
      void setDocumentStatus(newStatus)
    }
  }, [deliverablePlanning, setDocumentStatus])

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

                <div className='border bg-pink'>
                  {!!deliverablePlanning && (
                    <StatusMenu
                      type='core/article'
                      status={documentStatus}
                      publishTime={publishTime ? new Date(publishTime) : undefined}
                      setStatus={setArticleStatus}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </ViewHeader.Content>

      <ViewHeader.Action>
        <MetaSheet container={containerRef.current} documentId={documentId} />
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
