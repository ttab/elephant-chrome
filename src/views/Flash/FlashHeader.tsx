import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import type { ViewProps } from '@/types/index'
import { ZapIcon, ZapOffIcon } from '@ttab/elephant-ui/icons'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useView } from '@/hooks/useView'
import { useHistory, useNavigation, useWorkflowStatus } from '@/hooks/index'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const FlashHeader = ({
  ydoc,
  readOnly,
  asDialog,
  onDialogClose
}: {
  ydoc: YDocument<Y.Map<unknown>>
  readOnly?: boolean
  asDialog?: boolean
  onDialogClose?: (() => void) | undefined
}) => {
  return (
    <ViewHeader.Root>
      {!asDialog && (
        <ViewHeader.Title name='Flash' title='Flash' icon={!readOnly ? ZapIcon : ZapOffIcon} iconColor='#FF5150' />
      )}

      <ViewHeader.Content>
        <div className='flex w-full h-full items-center space-x-2 font-bold'>
          {asDialog && (
            <ViewHeader.Title name='Flash' title='Skapa ny flash' icon={ZapIcon} iconColor='#FF3140' />
          )}
        </div>

        {!asDialog && !!ydoc && <ViewHeader.RemoteUsers ydoc={ydoc} />}
        {!asDialog && !!ydoc.id && <StatusMenuHeader id={ydoc.id} />}
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog} />
    </ViewHeader.Root>
  )
}

const StatusMenuHeader = ({ id }: ViewProps) => {
  const planningId = useDeliverablePlanningId(id || '')
  const [publishTime] = useState<string | null>(null)
  const { viewId } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const [workflowStatus] = useWorkflowStatus(id || '', true)

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
    if (!planningId) {
      toast.error('Kunde inte ändra status på flash! Det gick inte att hitta en kopplad planering.')
      return false
    }

    if (newStatus === 'usable') {
      handleLink({
        dispatch,
        viewItem: state.viewRegistry.get('Flash'),
        props: { id: id },
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
        viewItem: state.viewRegistry.get('Flash'),
        props: { id: id },
        viewId: crypto.randomUUID(),
        history,
        origin: viewId,
        target: 'self'
      })
    }

    // We don't need to update publish time for flashes unless scheduling (when that would be?)
    if (newStatus !== 'withheld') {
      return true
    }

    // We require a valid publish time if scheduling
    if (!(data?.time instanceof Date)) {
      toast.error('Kunde inte schemalägga artikel! Tid eller datum är felaktigt angivet.')
      return false
    }

    const newPublishTime = ((data?.time instanceof Date))
      ? data.time
      : new Date()

    if (id) {
      await updateAssignmentTime(id, planningId, newStatus, newPublishTime)
    }

    return true
  }, [planningId, id, dispatch, history, state.viewRegistry, viewId, workflowStatus])

  return (
    <>
      {!!planningId && id && (
        <StatusMenu
          documentId={id}
          type='core/article' // same workflow as article?
          publishTime={publishTime ? new Date(publishTime) : undefined}
          onBeforeStatusChange={onBeforeStatusChange}
        />
      )}
    </>
  )
}
