import { useHistory, useLink, useNavigation, useView, useWorkflowStatus, useYValue } from '@/hooks'
import { Newsvalue } from '@/components/Newsvalue'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MetaSheet } from './components/MetaSheet'
import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { AddNote } from './components/Notes/AddNote'
import { ViewHeader } from '@/components/View'
import { PenBoxIcon, PenOff } from '@ttab/elephant-ui/icons'
import { toast } from 'sonner'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'
import { Button } from '@ttab/elephant-ui'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'

export const EditorHeader = ({ documentId, readOnly, readOnlyVersion }: { documentId: string, readOnly?: boolean, readOnlyVersion?: bigint }): JSX.Element => {
  const { viewId } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const planningId = useDeliverablePlanningId(documentId)
  const containerRef = useRef<HTMLElement | null>(null)
  const [publishTime] = useState<string | null>(null)
  const [workflowStatus] = useWorkflowStatus(documentId, true)
  const [documentType] = useYValue<string>('root.type')

  const openLatestVersion = useLink('Editor')

  useEffect(() => {
    containerRef.current = (document.getElementById(viewId))
  }, [viewId])

  // FIXME: We must have a way to retrieve the publish time defined in the planning.
  // FIXME: When yjs opening of related planning have been fixed this should be readded/remade.
  // This code relies on having the planning assignment publish time available to be able
  // set the correct suggested publish time when scheduling an article for publish.
  // Without this code it will always suggest "now()".
  //
  // useEffect(() => {
  //   if (deliverablePlanning) {
  //     const { index } = deliverablePlanning.getAssignment()
  //     const [ass] = getValueByYPath<EleBlock>(deliverablePlanning.yRoot, `meta.core/assignment[${index}]`)

  //     if (ass) {
  //       setPublishTime((prev) => (ass.data.publish !== prev) ? ass.data.publish : prev)
  //     }
  //   }
  // }, [deliverablePlanning])

  // Callback to set correct withheld time to the assignment
  const onBeforeStatusChange = useCallback(async (newStatus: string, data?: Record<string, unknown>) => {
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

    // When we set withheld or draft we must change related dates (publish and start respecively)
    if (['withheld', 'draft'].includes(newStatus)) {
      // We require a valid publish time if scheduling
      if (newStatus === 'withheld' && !(data?.time instanceof Date)) {
        toast.error('Kunde inte schemalägga artikel! Tid eller datum är felaktigt angivet.')
        return false
      }

      const newTime = ((data?.time instanceof Date))
        ? data.time
        : new Date()

      await updateAssignmentTime(documentId, planningId, newStatus, newTime)
    }

    return true
  }, [planningId, dispatch, documentId, history, state.viewRegistry, viewId, workflowStatus])

  const title = documentType === 'core/editorial-info' ? 'Till red' : 'Artikel'

  const isReadOnlyAndUpdated = workflowStatus && workflowStatus?.name !== 'usable' && readOnly
  const isUnpublished = workflowStatus?.name === 'unpublished'

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

                {isReadOnlyAndUpdated && !isUnpublished && (
                  <Button
                    variant='secondary'
                    onClick={(event) => {
                      openLatestVersion(
                        event,
                        { id: documentId },
                        'self'
                      )
                    }}
                  >
                    Gå till senaste versionen
                  </Button>
                )}

                {!!planningId && (!isReadOnlyAndUpdated || isUnpublished) && (
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
