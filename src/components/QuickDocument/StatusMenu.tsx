// src/components/DocumentHeader/StatusMenuLogic.tsx

import { StatusMenu } from '@/components/DocumentStatus/StatusMenu'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useDeliverablePlanningId } from '@/hooks/index/useDeliverablePlanningId'
import { updateAssignmentTime } from '@/lib/index/updateAssignmentPublishTime'
import { handleLink } from '@/components/Link/lib/handleLink'
import { useView } from '@/hooks/useView'
import { useHistory, useNavigation, useWorkflowStatus } from '@/hooks/index'
import type { YDocument } from '@/modules/yjs/hooks'
import type * as Y from 'yjs'
import type { DocumentView } from './types'
import { ViewMap } from './types' // Import the configuration map
import { useTranslation } from 'react-i18next'

interface StatusMenuHeaderProps {
  ydoc: YDocument<Y.Map<unknown>>
  propPlanningId?: string | null
  view: DocumentView // New prop to differentiate logic
}

export const StatusMenuLogic = ({ ydoc, propPlanningId, view }: StatusMenuHeaderProps) => {
  const viewConfig = ViewMap[view] // Get view-specific configuration
  const planningId = useDeliverablePlanningId(ydoc.id || '')
  const [publishTime] = useState<string | null>(null)
  const { viewId } = useView()
  const { state, dispatch } = useNavigation()
  const history = useHistory()
  const [workflowStatus] = useWorkflowStatus({ ydoc })
  const { t } = useTranslation()

  const onBeforeStatusChange = useCallback(async (newStatus: string, data?: Record<string, unknown>) => {
    if (!planningId) {
      // Use view-specific error message
      toast.error(viewConfig.statusErrorText)
      return false
    }

    // Determine the target for handleLink based on the view prop
    const targetView = viewConfig.linkTarget

    if (newStatus === 'usable') {
      handleLink({
        dispatch,
        // Use the configured linkTarget
        viewItem: state.viewRegistry.get(targetView),
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
        // Use the configured linkTarget
        viewItem: state.viewRegistry.get(targetView),
        props: { id: ydoc.id },
        viewId: crypto.randomUUID(),
        history,
        origin: viewId,
        target: 'self'
      })
    }

    // The logic for updating publish time is identical for both original components
    if (newStatus !== 'withheld') {
      return true
    }

    // We require a valid publish time if scheduling
    if (!(data?.time instanceof Date)) {
      toast.error(t('flash:errors.scheduleArticleFailed'))
      return false
    }

    const newPublishTime = ((data?.time instanceof Date))
      ? data.time
      : new Date()

    if (ydoc.id) {
      await updateAssignmentTime(ydoc.id, planningId, newStatus, newPublishTime, t)
    }

    return true
  }, [planningId, ydoc.id, dispatch, history, state.viewRegistry, viewId, workflowStatus, viewConfig.statusErrorText, viewConfig.linkTarget, t])

  return (
    <>
      {/* Renders if planningId exists from prop or hook, AND ydoc.id exists */}
      {!!(propPlanningId || planningId) && ydoc.id && (
        <StatusMenu
          ydoc={ydoc}
          publishTime={publishTime ? new Date(publishTime) : undefined}
          onBeforeStatusChange={onBeforeStatusChange}
        />
      )}
    </>
  )
}
