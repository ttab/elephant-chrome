import { getValueByYPath } from '@/lib/yUtils'
import { useCallback, useEffect, useState } from 'react'
import type * as Y from 'yjs'
import { useCollaborationDocument } from './useCollaborationDocument'
import type { EleBlock } from '@/shared/types'
import { useDeliverablePlanningId } from './index/usePlanningIdFromAssignmentId'

interface DeliverableReferences {
  planningUuid: string
  yRoot: Y.Map<unknown>
  getAssignment: (deliverableType?: string) => { id: string | undefined, index: number }
}

/**
 * This hook can receive a deliverableId (i.e. document uuid from an article/flash) and return
 * the actual planning y document with information on which assignment in that planning document
 * is referencing the deliverable.
 */
export const useDeliverablePlanning = (deliverableId: string): DeliverableReferences | null => {
  const planningUuid = useDeliverablePlanningId(deliverableId)
  const planningDoc = useCollaborationDocument({ documentId: planningUuid })
  const [yRoot, setYRoot] = useState<Y.Map<unknown> | undefined>()

  useEffect(() => {
    if (planningDoc?.document) {
      const ele = planningDoc.document.getMap('ele')
      setYRoot((prev) => (prev !== ele) ? ele : prev)
    }
  }, [planningDoc])

  // Expose helper callback function to retrieve the assignment index from the planning document
  const getAssignment = useCallback((deliverableType = 'core/article') => {
    if (yRoot) {
      const [assignments] = getValueByYPath<EleBlock[]>(yRoot, 'meta.core/assignment')

      for (let i = 0; i < (assignments?.length || 0); i++) {
        if (assignments?.[i].links?.[deliverableType]?.[0].uuid === deliverableId) {
          return {
            id: assignments[i].id,
            index: i
          }
        }
      }
    }

    return {
      id: undefined,
      index: -1
    }
  }, [yRoot, deliverableId])

  return !yRoot
    ? null
    : { planningUuid, getAssignment, yRoot }
}
