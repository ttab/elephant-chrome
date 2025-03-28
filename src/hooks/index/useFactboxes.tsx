import { useSession } from 'next-auth/react'
import type { QueryParams } from '../useQuery'
import { useRegistry } from '../useRegistry'
import type { Factbox } from './lib/factboxes'
import { fetch } from './lib/factboxes'
import { useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { useTable } from '../useTable'
export const useFactboxes = ({ filter, page }: {
  filter?: QueryParams
  page?: number
}): [Factbox[] | undefined] => {
  const { data: session } = useSession()
  const { index, repository } = useRegistry()
  const { setData } = useTable<Factbox>()


  // Create a key for the SWR cache, if it changes we do a refetch
  const key = useMemo(() => filter
    ? `core/factbox/${JSON.stringify(filter)}${page ? `/${page}` : ''}`
    : 'core/factbox', [filter, page])

  const fetcher = useMemo(() => (): Promise<Factbox[] | undefined> => {
    return fetch({ index, repository, session, filter, page })
  }, [index, repository, session, filter, page])

  const { data, error } = useSWR<Factbox[] | undefined, Error>(key, fetcher)

  if (error) {
    throw new Error('Factboxes fetch failed:', { cause: error })
  }

  // We need to wait after initial render to set the data
  useEffect(() => {
    if (data && setData) {
      setData(data)
    }
  }, [data, setData])

  return [data]
}
