import { useView, useYValue } from '@/hooks'
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
import { toast } from 'sonner'

export const EditorHeader = ({ documentId }: { documentId: string }): JSX.Element => {
  const { viewId } = useView()
  const deliverablePlanning = useDeliverablePlanning(documentId)
  const containerRef = useRef<HTMLElement | null>(null)
  const [publishTime, setPublishTime] = useState<string | null>(null)
  const [documentType] = useYValue<string>('root.type')


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

  // Callback to set correct withheld time to the assignment
  const onBeforeStatusChange = useCallback((newStatus: string, data?: Record<string, unknown>) => {
    if (!deliverablePlanning) {
      toast.error('Kunde inte ändra status på artikel! Det gick inte att hitta en kopplad planering.')
      return false
    }

    if (newStatus !== 'withheld') {
      return true
    }

    const { index } = deliverablePlanning.getAssignment()
    if (index < 0) {
      toast.error('Kunde inte schemalägga artikel! Det gick inte att hitta ett kopplat uppdrag i planeringen.')
      return false
    }

    if (!(data?.time instanceof Date)) {
      toast.error('Kunde inte schemalägga artikel! Tid eller datum är felaktigt angivet.')
      return false
    }

    setValueByYPath(deliverablePlanning.yRoot, `meta.core/assignment[${index}].data.publish`, data.time.toISOString())
    return true
  }, [deliverablePlanning])

  const title = documentType === 'core/editorial-info' ? 'Till red' : 'Artikel'
  return (
    <ViewHeader.Root>
      <ViewHeader.Title name='Editor' title={title} icon={PenBoxIcon} />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[810px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @lg/view:flex'>
              {documentType !== 'core/editorial-info' && <Newsvalue />}
              <AddNote />
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!documentId && (
              <>
                <ViewHeader.RemoteUsers documentId={documentId} />

                {!!deliverablePlanning && (
                  <StatusMenu
                    documentId={documentId}
                    type={documentType || 'core/article'}
                    publishTime={publishTime ? new Date(publishTime) : undefined}
                    onBeforeStatusChange={onBeforeStatusChange}
                  />
                )}
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
