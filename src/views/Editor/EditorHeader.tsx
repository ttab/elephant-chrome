import { useHistory, useLink, useNavigation, useView, useWorkflowStatus, useYValue } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon, PenOff } from '@ttab/elephant-ui/icons'
import { useDeliverablePlanning } from '@/hooks/useDeliverablePlanning'
import { getValueByYPath, setValueByYPath } from '@/lib/yUtils'
import type { EleBlock } from '@/shared/types'
import { toast } from 'sonner'
import { handleLink } from '@/components/Link/lib/handleLink'
import { Button } from '@ttab/elephant-ui'

export const EditorHeader = ({ documentId, readOnly, readOnlyVersion }: { documentId: string, readOnly?: boolean, readOnlyVersion?: bigint }): JSX.Element => {
  const { viewId } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const deliverablePlanning = useDeliverablePlanning(documentId)
  const containerRef = useRef<HTMLElement | null>(null)
  const [publishTime, setPublishTime] = useState<string | null>(null)
  const [workflowStatus] = useWorkflowStatus(documentId, true)
  const [documentType] = useYValue<string>('root.type')

  const openLatestVersion = useLink('Editor')

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

    const { index } = deliverablePlanning.getAssignment()
    // If assignment publish time is in the past, set it to current time
    const base = `meta.core/assignment[${index}]`
    const [assignmentType] = getValueByYPath<string | undefined>(deliverablePlanning.yRoot, `${base}.meta.core/assignment-type[0].value`)

    if (assignmentType && ['text', 'flash'].includes(assignmentType)) {
      const now = new Date().toISOString()
      const [existingPublishTime] = getValueByYPath<string | undefined>(deliverablePlanning.yRoot, `${base}.data.publish`)
      if (existingPublishTime && (now > existingPublishTime)) {
        setValueByYPath(deliverablePlanning.yRoot, `meta.core/assignment[${index}].data.publish`, now)
      }
    }

    if (newStatus !== 'withheld') {
      return true
    }

    if (index < 0) {
      toast.error('Kunde inte schemalägga artikel! Det gick inte att hitta ett kopplat uppdrag i planeringen.')
      return false
    }

    if (!(data?.time instanceof Date)) {
      toast.error('Kunde inte schemalägga artikel! Tid eller datum är felaktigt angivet.')
      return false
    }

    setValueByYPath(deliverablePlanning.yRoot, `${base}.data.publish`, data.time.toISOString())
    return true
  }, [deliverablePlanning, dispatch, documentId, history, state.viewRegistry, viewId, workflowStatus])

  const title = documentType === 'core/editorial-info' ? 'Till red' : 'Artikel'

  const isReadOnlyAndUpdated = workflowStatus && workflowStatus?.name !== 'usable' && readOnly

  return (
    <ViewHeader.Root>
      <ViewHeader.Title name='Editor' title={title} icon={readOnly ? PenOff : PenBoxIcon} />

      <ViewHeader.Content className='justify-start'>
        <div className='max-w-[810px] mx-auto flex flex-row gap-2 justify-between items-center w-full'>
          <div className='flex flex-row gap-1 justify-start items-center @7xl/view:-ml-20'>
            <div className='hidden flex-row gap-2 justify-start items-center @lg/view:flex'>
              {!readOnly && <AddNote />}
              {!readOnly && documentType !== 'core/editorial-info' && <Newsvalue />}
            </div>
          </div>

          <div className='flex flex-row gap-2 justify-end items-center'>
            {!!documentId && (
              <>
                {!readOnly && <ViewHeader.RemoteUsers documentId={documentId} />}
                {isReadOnlyAndUpdated && (
                  <Button
                    variant='secondary'
                    onClick={(event) => {
                      openLatestVersion(event, {
                        id: documentId
                      },
                      'self'
                      )
                    }}
                  >
                    Gå till senaste versionen
                  </Button>
                )}
                {!!deliverablePlanning && !isReadOnlyAndUpdated && (
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
        <MetaSheet container={containerRef.current} documentId={documentId} readOnly={readOnly} readOnlyVersion={readOnlyVersion} />
      </ViewHeader.Action>
    </ViewHeader.Root>
  )
}
