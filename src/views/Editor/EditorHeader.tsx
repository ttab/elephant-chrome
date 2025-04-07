import { useHistory, useNavigation, useView, useWorkflowStatus } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon, Eye, PenOff } from '@ttab/elephant-ui/icons'
import { useDeliverablePlanning } from '@/hooks/useDeliverablePlanning'
import { getValueByYPath, setValueByYPath } from '@/lib/yUtils'
import type { EleBlock } from '@/shared/types'
import { toast } from 'sonner'
import { handleLink } from '@/components/Link/lib/handleLink'

export const EditorHeader = ({ documentId, readOnly }: { documentId: string, readOnly?: boolean }): JSX.Element => {
  const { viewId } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const deliverablePlanning = useDeliverablePlanning(documentId)
  const containerRef = useRef<HTMLElement | null>(null)
  const [publishTime, setPublishTime] = useState<string | null>(null)
  const [workflowStatus] = useWorkflowStatus(documentId, true)

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

    if (newStatus === 'usable') {
      handleLink({
        dispatch,
        viewItem: state.viewRegistry.get('Editor'),
        props: { id: documentId },
        viewId: crypto.randomUUID(),
        history,
        origin: viewId,
        target: 'self',
        readOnly: {
          version: workflowStatus?.version
        }
      })
    }

    if (newStatus === 'draft') {
      handleLink({
        dispatch,
        viewItem: state.viewRegistry.get('Editor'),
        props: { id: documentId },
        viewId: crypto.randomUUID(),
        history,
        origin: viewId,
        target: 'self'
      })
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
  }, [deliverablePlanning, dispatch, documentId, history, state.viewRegistry, viewId, workflowStatus])

  return (
    <ViewHeader.Root>
      <ViewHeader.Title name='Editor' title='Artikel' icon={readOnly ? PenOff : PenBoxIcon} />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[810px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @lg/view:flex'>
              {!readOnly && <Newsvalue />}
              {!readOnly && <AddNote />}
              {readOnly && <Eye size={18} strokeWidth={2.05} color='#555' />}
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!documentId && (
              <>
                {!readOnly && <ViewHeader.RemoteUsers documentId={documentId} />}

                {!!deliverablePlanning && (
                  <StatusMenu
                    documentId={documentId}
                    type='core/article'
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
