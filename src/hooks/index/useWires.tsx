import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { useRegistry } from '../useRegistry'
import { fetch, handlers } from './lib/wires'
import { useTable } from '../useTable'
import { useEffect, useMemo, useRef } from 'react'
import type { Wire } from './lib/wires'
import { useRepositoryEvents } from '../useRepositoryEvents'
import type { QueryParams } from '../useQuery'

export const useWires = ({ filter, page }: {
  filter?: QueryParams
  page?: number
}): [Wire[] | undefined] => {
  const { data: session } = useSession()
  const { index, repository } = useRegistry()
  const { setData } = useTable<Wire>()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retriesRef = useRef(0)

  // Create a key for the SWR cache, if it changes we do a refetch
  const key = useMemo(() => filter
    // TODO make better key
    ? `tt/wire/${JSON.stringify(filter)}${page ? `/${page}` : ''}`
    : 'tt/wire', [filter, page])

  const fetcher = useMemo(() => (): Promise<Wire[] | undefined> =>
    fetch({ index, repository, session, filter, page }),
  [index, repository, session, filter, page])

  const { data, mutate, error } = useSWR<Wire[] | undefined, Error>(key, fetcher)

  if (error) {
    throw new Error('Wires fetch failed:', { cause: error })
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

  useRepositoryEvents(['tt/wire', 'tt/wire+meta'], (event) => {
    if (event.event !== 'document' && event.event !== 'status' && event.event !== 'delete_document') {
      return
    }

    // Optimistic update and eventually revalidation of new documents
    if (event.event === 'document') {
      void handlers.handleDocumentEvent({
        event,
        session,
        repository,
        source: filter?.source,
        data,
        mutate,
        timeoutRef
      })
    }

    // Optimistic update and eventually revalidation of statuses
    if (event.event === 'status') {
      void handlers.handleStatusEvent({
        event,
        data,
        mutate,
        timeoutRef
      })
    }
  })

  return [data]
}
