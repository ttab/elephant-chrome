import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useRegistry } from '../useRegistry'
import { fetch } from './lib/printFlows'
import { useTable } from '../useTable'
import { useEffect, useMemo, useRef } from 'react'
import type { PrintFlow } from './lib/printFlows'
import { useRepositoryEvents } from '../useRepositoryEvents'
import type { QueryParams } from '../useQuery'

export const usePrintFlows = ({ filter, page }: {
  filter?: QueryParams
  page?: number
}): [PrintFlow[] | undefined] => {
  const { data: session } = useSession()
  const { index, repository } = useRegistry()
  const { setData } = useTable<PrintFlow>()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retriesRef = useRef(0)

  // Create a key for the SWR cache, if it changes we do a refetch
  const key = useMemo(() => filter
    // TODO make better key
    ? `tt/print-flow/${JSON.stringify(filter)}${page ? `/${page}` : ''}`
    : 'tt/print-flow', [filter, page])

  const fetcher = useMemo(() => (): Promise<PrintFlow[] | undefined> =>
    fetch({ index, repository, session, filter, page }),
  [index, repository, session, filter, page])

  const { data, mutate, error } = useSWR<PrintFlow[] | undefined, Error>(key, fetcher)

  if (error) {
    throw new Error('PrintFlows fetch failed:', { cause: error })
  }

  // We need to wait after initial render to set the data
  useEffect(() => {
    if (data && setData) {
      setData(data)
    }
  }, [data, setData])

  if (error) {
    if (retriesRef.current < 5) {
      retriesRef.current += 1
      timeoutRef.current = setTimeout(() => {
        void mutate()
      }, 1000)
    }
    throw new Error('Wires fetch failed:', { cause: error })
  }

  useRepositoryEvents(['tt/print-flow', 'tt/print-flow+meta'], (event) => {
    if (event.event !== 'document' && event.event !== 'status' && event.event !== 'delete_document') {
      return
    }
  })
  return [data]
}
