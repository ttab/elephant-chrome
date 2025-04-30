import { useSession } from 'next-auth/react'
import type { SWRResponse } from 'swr'
import useSWR from 'swr'
import { useRegistry } from '@/hooks/useRegistry'
import { fetch } from './lib/fetch'
import { useTable } from '@/hooks/useTable'
import { useEffect, useMemo } from 'react'
import type { HitV1, QueryV1, SortingV1 } from '@ttab/elephant-api/index'
import type { Planning } from './schemas/planning'

export const useDocuments = ({ documentType, query, size, page, fields, sort, options }: {
  documentType: string
  query?: QueryV1
  fields?: string[]
  size?: number
  page?: number
  sort?: SortingV1[]
  options?: {
    allPages?: boolean
    withStatus?: boolean
    withPlannings?: boolean
  }
}): SWRResponse<HitV1[], Error> => {
  const { data: session } = useSession()
  const { index } = useRegistry()
  // TODO: Generics
  const { setData } = useTable<Planning>()

  // Create a key for the SWR cache, if it changes we do a refetch
  const key = useMemo(() => query
    ? `${documentType}/${JSON.stringify(query)}${page ? `/${page}` : ''}`
    : documentType, [query, page, documentType])

  const fetcher = useMemo(() => (): Promise<HitV1[]> =>
    fetch({ index, session, page, size, documentType, query, fields, sort, options }),
  [index, session, page, size, documentType, query, fields, sort, options])

  const { data, error, mutate, isLoading, isValidating } = useSWR<HitV1[], Error>(key, fetcher)

  if (error) {
    throw new Error('Document fetch failed:', { cause: error })
  }

  // We need to wait after initial render to set the data
  useEffect(() => {
    if (data && setData) {
      setData(data)
    }
  }, [data, setData])

  // TODO: add retries
  return { data, error, mutate, isValidating, isLoading }
}
