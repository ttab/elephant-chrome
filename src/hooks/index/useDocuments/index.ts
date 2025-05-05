import { useSession } from 'next-auth/react'
import type { SWRResponse } from 'swr'
import useSWR from 'swr'
import { useRegistry } from '@/hooks/useRegistry'
import { fetch } from './lib/fetch'
import { useTable } from '@/hooks/useTable'
import { useEffect, useMemo } from 'react'
import type { HitV1, QueryV1, SortingV1 } from '@ttab/elephant-api/index'

/**
 * Options for augmenting or performing the fetch in the `useDocuments` hook.
 *
 * @property aggregatePages - Aggregates pages into a single result.
 * @property withStatus - Append current status to `document.meta.status` field.
 * @property withPlannings - Append `_relatedPlannings` to the result.
 */
export interface useDocumentsFetchOptions {
  aggregatePages?: boolean
  withStatus?: boolean
  withPlannings?: boolean
  setTableData?: boolean
}

/**
 * Custom hook to query index for documents.
 *
 * @param params - Parameters for fetching documents.
 * @param params.documentType - The type of document to fetch.
 * @param params.query - Query object to filter documents.
 * @param params.fields - Specific fields to retrieve.
 * @param params.size - Number of documents per page.
 * @param params.page - Page number for pagination.
 * @param params.sort - Sorting options for the documents.
 * @param params.options - Additional options for fetching documents.
 * @returns SWR response containing the fetched documents and related metadata.
 */
export const useDocuments = <T extends HitV1, F>({ documentType, query, size, page, fields, sort, options }: {
  documentType: string
  query?: QueryV1
  fields?: F
  size?: number
  page?: number
  sort?: SortingV1[]
  options?: useDocumentsFetchOptions
}): SWRResponse<T[], Error> => {
  const { data: session } = useSession()
  const { index } = useRegistry()
  const { setData } = useTable<T>()

  // Create a key for the SWR cache, if it changes we do a refetch
  const key = useMemo(() => query
    ? `${documentType}/${JSON.stringify(query)}${page ? `/${page}` : ''}`
    : documentType, [query, page, documentType])

  const fetcher = useMemo(() => (): Promise<T[]> =>
    fetch<T, F>({
      index,
      session,
      page,
      size,
      documentType,
      query,
      fields,
      sort,
      options
    }),
  [index, session, page, size, documentType, query, fields, sort, options])

  const { data, error, mutate, isLoading, isValidating } = useSWR<T[], Error>(key, fetcher)

  if (error) {
    throw new Error('Document fetch failed:', { cause: error })
  }

  // We need to wait after initial render to set the data
  useEffect(() => {
    if (data && setData && options?.setTableData) {
      setData(data)
    }
  }, [data, setData, options?.setTableData])

  return { data, error, mutate, isValidating, isLoading }
}
