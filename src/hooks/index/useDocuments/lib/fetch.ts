import type { Index } from '@/shared/Index'
import type { Session } from 'next-auth'
import type { HitV1, QueryV1, SortingV1 } from '@ttab/elephant-api/index'
import { withStatus } from './withStatus'
import { withPlannings } from './withPlannings'

export async function fetch({ index, session, query, page = 1, size = 100, documentType, fields, sort, options }: {
  index: Index | undefined
  session: Session | null
  query?: QueryV1
  page?: number
  size?: number
  documentType: string
  fields?: string[]
  sort?: SortingV1[]
  options?: {
    allPages?: boolean
    withStatus?: boolean
    withPlannings?: boolean
  }
}): Promise<HitV1[]> {
  if (!index || !session?.accessToken) {
    throw new Error('Index or access token is missing')
  }

  const { ok, hits, errorMessage } = await index.query({
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

  let result = hits

  // Append and format statuses
  if (options?.withStatus) {
    result = withStatus(result)
  }

  // Append _relatedPlannings
  if (options?.withPlannings) {
    result = await withPlannings({ hits: result, session, index })
  }

  return result || []
}
