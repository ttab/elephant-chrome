import type { Index } from '@/shared/Index'
import type { Session } from 'next-auth'
import type { HitV1, QueryV1, SortingV1, SubscriptionReference } from '@ttab/elephant-api/index'
import { withStatus } from './withStatus'
import { withPlannings } from './withPlannings'
import type { useDocumentsFetchOptions } from '../'
import type { Dispatch, SetStateAction } from 'react'

export async function fetch<T extends HitV1, F>({
  index,
  session,
  query,
  page = 1,
  size = 100,
  documentType,
  fields,
  sort,
  setSubscriptions,
  options
}: {
  index: Index | undefined
  session: Session | null
  query?: QueryV1
  page?: number
  size?: number
  documentType: string
  fields?: F
  sort?: SortingV1[]
  setSubscriptions?: Dispatch<SetStateAction<SubscriptionReference[] | undefined>>
  options?: useDocumentsFetchOptions
}): Promise<T[]> {
  if (!index || !session?.accessToken) {
    throw new Error('Index or access token is missing')
  }

  const { ok, hits, errorMessage, subscriptions } = await index.query<T, F>({
    documentType,
    fields,
    accessToken: session.accessToken,
    query,
    size,
    page,
    sort,
    options
  })

  if (!ok) {
    throw new Error(errorMessage || 'Unknown error while fetching data')
  }

  if (subscriptions && subscriptions.length) {
    setSubscriptions?.(subscriptions)
  }

  let result = hits

  // Append and format statuses
  if (options?.withStatus) {
    result = withStatus<T>(result)
  }

  // Append _relatedPlannings
  if (options?.withPlannings) {
    result = await withPlannings<T>({ hits: result, session, index })
  }

  return result
}
