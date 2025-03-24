import { getValueByYPath } from '@/lib/yUtils'
import { useCallback, useEffect, useState } from 'react'
import type * as Y from 'yjs'
import { useCollaborationDocument } from './useCollaborationDocument'
import { useYValue } from './useYValue'
import type { EleBlock } from '@/shared/types'
import { usePlanningIdFromAssignmentId } from './index/usePlanningIdFromAssignmentId'

interface DeliverableReferences {
  planningUuid: string
  assignmentUuid: string
  yRoot: Y.Map<unknown>
  assignmentIndex: () => number
}

/**
 * This hook can receive a deliverableId (i.e. document uuid from an article/flash) and return
 * the actual planning y document with information on which assignment in that planning document
 * is referencing the deliverable.
 */
export const useDeliverablePlanning = (deliverableId: string): DeliverableReferences | null => {
  const [assignmentUuid, setAssignmentUuid] = useState('')
  const planningUuid = usePlanningIdFromAssignmentId(assignmentUuid)
  const [articleAssignmentLinks] = useYValue<EleBlock[]>('links.core/assignment')
  const planningDoc = useCollaborationDocument({ documentId: planningUuid })
  const [yRoot, setYRoot] = useState<Y.Map<unknown> | undefined>()

  // Find the assignment uuid in the current collaborative document (i.e. article or flash)
  // FIXME: It seems articleAssignmentLinks are sometimes/always empty on articles created in Elephant
  useEffect(() => {
    if (!articleAssignmentLinks?.length) {
      return
    }

    for (const assignment of articleAssignmentLinks) {
      if (assignment.type === 'core/assignment') {
        setAssignmentUuid((prev) => (prev !== assignment.uuid ? assignment.uuid : prev))
        break
      }
    }
  }, [articleAssignmentLinks])

  useEffect(() => {
    if (planningDoc?.document) {
      const ele = planningDoc.document.getMap('ele')
      setYRoot((prev) => (prev !== ele) ? ele : prev)
    }
  }, [planningDoc])

  // Expose helper callback function to retrieve the assignment index from the planning document
  const assignmentIndex = useCallback(() => {
    if (yRoot) {
      const [assignments] = getValueByYPath<EleBlock[]>(yRoot, 'meta.core/assignment')

      for (let i = 0; i < (assignments?.length || 0); i++) {
        if (assignments?.[i].links?.['core/article']?.[0].uuid === deliverableId) {
          return i
        }
      }
    }

    return -1
  }, [yRoot, deliverableId])

  return !yRoot
    ? null
    : { planningUuid, assignmentUuid, yRoot, assignmentIndex }
}
