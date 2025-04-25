import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useRegistry } from '../useRegistry'
import { fetch } from './lib/printArticles'
import { useTable } from '../useTable'
import { useEffect, useMemo } from 'react'
import type { PrintArticle } from './lib/printArticles'
import type { QueryParams } from '../useQuery'

/**
 * Custom hook to fetch print articles using SWR.
 *
 * @param params - The parameters for fetching print articles.
 * @param params.filter - Optional filter parameters for querying print articles.
 * @param params.page - Optional page number for pagination.
 * @returns - An array containing the fetched print articles or undefined.
 *
 * @throws If fetching print articles fails.
 *
 * @remarks
 * This hook uses SWR for data fetching and caching. It also handles retries on fetch failure
 * and updates the data using the `useTable` hook. Additionally, it listens for repository events
 * to react to changes in print articles.
 */

export const usePrintArticles = ({ filter, page }: {
  filter?: QueryParams
  page?: number
}): [PrintArticle[] | undefined] => {
  const { data: session } = useSession()
  const { index, repository } = useRegistry()
  const { setData } = useTable<PrintArticle>()

  // Create a key for the SWR cache, if it changes we do a refetch
  const key = useMemo(() => filter
    // TODO make better key
    ? `tt/print-article/${JSON.stringify(filter)}${page ? `/${page}` : ''}`
    : 'tt/print-article', [filter, page])

  const fetcher = useMemo(() => (): Promise<PrintArticle[] | undefined> =>
    fetch({ index, repository, session, filter, page }),
  [index, repository, session, filter, page])

  const { data, error } = useSWR<PrintArticle[] | undefined, Error>(key, fetcher)

  if (error) {
    throw new Error('PrintArticles fetch failed:', { cause: error })
  }

  // We need to wait after initial render to set the data
  useEffect(() => {
    if (data && setData) {
      setData(data)
    }
  }, [data, setData])

  return [data]
}
