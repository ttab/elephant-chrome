import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { ViewHeader } from '@/components/View'
import { NewspaperIcon } from '@ttab/elephant-ui/icons'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useView } from '@/hooks/useView'
import { useHistory, useNavigation, useWorkflowStatus } from '@/hooks/index'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'

export const QuickArticleHeader = ({
  ydoc,
  asDialog,
  onDialogClose,
  preview,
  planningId
}: {
  ydoc: YDocument<Y.Map<unknown>>
  readOnly?: boolean
  asDialog?: boolean
  onDialogClose?: (() => void) | undefined
  preview?: boolean
  planningId?: string | null
}) => {
  return (
    <ViewHeader.Root>
      {!asDialog && (
        <ViewHeader.Title name='QuickArticle' title='Snabbartikel' icon={NewspaperIcon} iconColor='#FF5150' preview={preview} />
      )}

      <ViewHeader.Content>
        <div className='flex w-full h-full items-center space-x-2 font-bold'>
          {asDialog && (
            <ViewHeader.Title name='QuickArticle' title='Skapa ny snabbartikel' icon={NewspaperIcon} iconColor='#aabbcc' />
          )}
        </div>

        {!asDialog && !!ydoc && !preview && <ViewHeader.RemoteUsers ydoc={ydoc} />}
        {!asDialog && !!ydoc.id && !preview && <StatusMenuHeader ydoc={ydoc} planningId={planningId} />}
      </ViewHeader.Content>

      <ViewHeader.Action onDialogClose={onDialogClose} asDialog={asDialog} />
    </ViewHeader.Root>
  )
}

const StatusMenuHeader = ({ ydoc, planningId: propPlanningId }: {
  ydoc: YDocument<Y.Map<unknown>>
  planningId?: string | null
}) => {
  const planningId = useDeliverablePlanningId(ydoc.id || '')
  const [publishTime] = useState<string | null>(null)
  const { viewId } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const [workflowStatus] = useWorkflowStatus({ ydoc, isWorkflow: true })

  const onBeforeStatusChange = useCallback(async (newStatus: string, data?: Record<string, unknown>) => {
    if (!planningId) {
      toast.error('Kunde inte ändra status på flash! Det gick inte att hitta en kopplad planering.')
      return false
    }

    if (newStatus === 'usable') {
      handleLink({
        dispatch,
        viewItem: state.viewRegistry.get('Planning'),
        props: { id: ydoc.id },
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
        viewItem: state.viewRegistry.get('Planning'),
        props: { id: ydoc.id },
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

    if (ydoc.id) {
      await updateAssignmentTime(ydoc.id, planningId, newStatus, newPublishTime)
    }

    return true
  }, [planningId, ydoc.id, dispatch, history, state.viewRegistry, viewId, workflowStatus])

  return (
    <>
      {!!(propPlanningId || planningId) && ydoc.id && (
        <StatusMenu
          ydoc={ydoc}
          type='core/article'
          publishTime={publishTime ? new Date(publishTime) : undefined}
          onBeforeStatusChange={onBeforeStatusChange}
        />
      )}
    </>
  )
}
