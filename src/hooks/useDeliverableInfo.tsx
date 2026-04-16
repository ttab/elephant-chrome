import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useCallback, useMemo } from 'react'
import { useRegistry, useRepositoryEvents } from '@/hooks'
import type { GetDeliverableInfoResponse } from '@ttab/elephant-api/repository'

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

  const revalidate = useCallback(() => {
    void mutate()
  }, [mutate])

  useRepositoryEvents('core/planning-item', revalidate)

  return data ?? undefined
}
