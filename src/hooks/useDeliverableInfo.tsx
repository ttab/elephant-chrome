import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import type { EventlogItem, GetDeliverableInfoResponse } from '@ttab/elephant-api/repository'

export const useDeliverableInfo = (deliverableId: string): GetDeliverableInfoResponse | undefined => {
  const { repository } = useRegistry()
  const { data: session } = useSession()

  const cacheKey = useMemo(
    () => (deliverableId && session && repository)
      ? `deliverable-info/${deliverableId}`
      : null,
    [deliverableId, session, repository]
  )

  const { data, mutate } = useSWR<GetDeliverableInfoResponse | null>(
    cacheKey,
    async () => {
      if (!session || !repository || !deliverableId) {
        return null
      }

      return repository.getDeliverableInfo({
        uuid: deliverableId,
        accessToken: session.accessToken
      })
    }
  )

  const planningUuidRef = useRef<string | undefined>(data?.planningUuid)
  const hasResolvedRef = useRef(data !== undefined)
  useEffect(() => {
    planningUuidRef.current = data?.planningUuid
    if (data !== undefined) {
      hasResolvedRef.current = true
    }
  }, [data])

  const onPlanningEvent = useCallback((event: EventlogItem) => {
    const planningUuid = planningUuidRef.current
    if (planningUuid) {
      if (event.uuid === planningUuid) {
        void mutate()
      }
      return
    }
    // Orphan deliverable: first fetch resolved without a linked planning.
    // Any planning event could be the one that adopts us, so revalidate.
    if (hasResolvedRef.current) {
      void mutate()
    }
  }, [mutate])

  useRepositoryEvents('core/planning-item', onPlanningEvent)

  return data ?? undefined
}
