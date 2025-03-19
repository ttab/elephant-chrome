import { getValueByYPath } from '@/lib/yUtils'
import { useEffect, useMemo, useState } from 'react'
import type * as Y from 'yjs'
import { useCollaborationDocument } from './useCollaborationDocument'
import { useYValue } from './useYValue'
import type { EleBlock } from '@/shared/types'
import { usePlanningIdFromAssignmentId } from './index/usePlanningIdFromAssignmentId'

interface DeliverablePlanningAssignment {
  planningUuid: string
  assignmentUuid: string
  yRoot: Y.Map<unknown>
  assignment: Y.Map<unknown>
  index: number
}

/**
 * This hook can receive a deliverableId (i.e. document uuid from an article/flash) and return
 * the actual planning y document with information on which assignment in that planning document
 * is referencing the deliverable.
 */
export const usePlanningAssigmentDeliverable = (deliverableId: string): DeliverablePlanningAssignment | null => {
  const [assignmentUuid, setAssignmentUuid] = useState('')
  const [deliverable, setDeliverable] = useState<DeliverablePlanningAssignment | null>(null)

  const planningUuid = usePlanningIdFromAssignmentId(assignmentUuid)
  const [articleAssignmentLinks] = useYValue<EleBlock[]>('links.core/assignment')
  const planningDoc = useCollaborationDocument({ documentId: planningUuid })

  // FIXME: It seems articleAssignmentLinks are sometimes/always empty on articles created in Elephant
  useEffect(() => {
    if (!articleAssignmentLinks?.length) {
      return
    }

    for (const assignment of articleAssignmentLinks) {
      if (assignment.type === 'core/assignment') {
        setAssignmentUuid(assignment.uuid)
        break
      }
    }
  }, [articleAssignmentLinks])


  const yRoot = useMemo(() => {
    return planningDoc?.document && planningDoc.synced
      ? planningDoc.document.getMap('ele')
      : null
  }, [planningDoc])


  useEffect(() => {
    if (!yRoot) {
      return
    }

    const [assignments] = getValueByYPath<Y.Array<Y.Map<unknown>>>(yRoot, 'meta.core/assignment', true)

    if (!assignments?.length) {
      return
    }

    for (let i = 0; i < assignments.length; i++) {
      const [linkedArticleId] = getValueByYPath<string>(yRoot, `meta.core/assignment[${i}].links.core/article[0].uuid`)

      if (linkedArticleId === deliverableId) {
        setDeliverable({
          planningUuid,
          assignmentUuid,
          yRoot,
          assignment: assignments.get(i),
          index: i
        })

        break
      }
    }
  }, [yRoot, planningUuid, assignmentUuid, deliverableId])

  return deliverable
}
