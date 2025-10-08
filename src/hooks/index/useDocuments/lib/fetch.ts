import type { Index } from '@/shared/Index'
import type { Session } from 'next-auth'
import type { HitV1, QueryV1, SortingV1, SubscriptionReference } from '@ttab/elephant-api/index'
import type { Repository } from '@/shared/Repository'
import { withStatus } from './withStatus'
import { withPlannings } from './withPlannings'
import type { useDocumentsFetchOptions } from '../'
import type { Dispatch, SetStateAction } from 'react'
import { asAssignments } from './asAssignments'
import type { Assignment } from '@/shared/schemas/assignments'
import { getDeliverableStatuses } from './getDeliverableStatuses'

export async function fetch<T extends HitV1, F>({
  index,
  repository,
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
  repository?: Repository
  query?: QueryV1
  page?: number
  size?: number
  documentType: string
  fields?: F
  sort?: SortingV1[]
  setSubscriptions?: Dispatch<SetStateAction<SubscriptionReference[] | undefined>>
  options?: useDocumentsFetchOptions
}): Promise<{ result: T[], total: number }> {
  if (!index || !session?.accessToken) {
    throw new Error('Index or access token is missing')
  }

  const { ok, hits, errorMessage, subscriptions, total } = await index.query<T, F>({
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
  console.log(total)

  // Format planning result as assignments
  if (options?.asAssignments && query) {
    const statuses = await getDeliverableStatuses({ result, repository, session })
    return { result: asAssignments(result as unknown as Assignment[], query, statuses) as unknown as T[], total: total }
  }
  // Append and format statuses
  if (options?.withStatus) {
    result = withStatus<T>(result)
  }

  // Append _relatedPlannings
  if (options?.withPlannings) {
    result = await withPlannings<T>({ hits: result, session, index })
  }


  return { result: result, total: total }
}
