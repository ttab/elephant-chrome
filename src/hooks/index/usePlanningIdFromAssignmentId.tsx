import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRegistry } from '../useRegistry'
import { QueryV1, TermQueryV1 } from '@ttab/elephant-api/index'

/**
 * Hook that fetches an assignments planning id. Especially useful when you have an article
 * or flash document and need to find out which planning document it is related to as article
 * or flash document only have a reference to the assignment in the planning.
 */
export const usePlanningIdFromAssignmentId = (assignmentId: string): string => {
  const { data: session } = useSession()
  const { index } = useRegistry()
  const [planningId, setPlanningId] = useState('')

  useEffect(() => {
    if (!assignmentId || !session?.accessToken || !index) {
      return
    }

    const fetchData = async () => {
      try {
        const query = QueryV1.create({
          conditions: {
            oneofKind: 'term',
            term: TermQueryV1.create({
              field: 'document.meta.core_assignment.id',
              value: assignmentId
            })
          }
        })

        const { ok, hits, errorMessage } = await index.query({
          accessToken: session.accessToken,
          documentType: 'core/planning-item',
          size: 1,
          page: 1,
          fields: ['document.id'],
          query
        })

        if (!ok) {
          throw new Error(errorMessage || 'Unknown error while searching for text assignments')
        }

        if (hits.length === 1) {
          setPlanningId(hits[0].id)
        }
      } catch (err) {
        console.error((err as Error).message || 'An error occurred')
      }
    }

    void fetchData()
  }, [assignmentId, session?.accessToken, index])

  return planningId
}
