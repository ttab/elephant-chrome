import { QueryV1, TermQueryV1 } from '@ttab/elephant-api/index'
import { useDocuments } from './useDocuments'
import type { Planning, PlanningFields } from './useDocuments/schemas/planning'

/**
 * Hook that fetches an assignments planning id. Especially useful when you have an article
 * or flash document and need to find out which planning document it is related to as article
 * or flash document only have a reference to the assignment in the planning.
 */
export const useDeliverablePlanningId = (deliverableId: string): string => {
  const { data } = useDocuments<Planning, PlanningFields>({
    documentType: 'core/planning-item',
    query: QueryV1.create({
      conditions: {
        oneofKind: 'term',
        term: TermQueryV1.create({
          field: 'document.meta.core_assignment.rel.deliverable.uuid',
          value: deliverableId
        })
      }
    }),
    fields: [],
    options: {
      subscribe: true
    }
  })

  if (data?.length === 1) {
    return data[0].id
  }


  return ''
}
