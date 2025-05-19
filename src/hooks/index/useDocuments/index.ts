import { useSession } from 'next-auth/react'
import type { KeyedMutator, SWRResponse } from 'swr'
import useSWR from 'swr'
import { useRegistry } from '@/hooks/useRegistry'
import { fetch } from './lib/fetch'
import { useTable } from '@/hooks/useTable'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SubscriptionItem, SubscriptionReference } from '@ttab/elephant-api/index'
import { type HitV1, type PollSubscriptionResponse, type QueryV1, type SortingV1 } from '@ttab/elephant-api/index'
import { toast } from 'sonner'
import type { Index } from '@/shared/Index'
import { getInterval } from '@/shared/getInterval'
import type { Session } from 'next-auth'

/**
 * Options for augmenting or performing the fetch in the `useDocuments` hook.
 *
 * @property {boolean} aggregatePages - Aggregates pages into a single result.
 * @property {boolean} withStatus - Append current status to `document.meta.status` field.
 * @property {boolean} withPlannings - Append `_relatedPlannings` to the result.
 * @property {boolean} setTableData - Set the data in the table context.
 * @property {boolean} subscribe - Subscribe to document changes.
 */
export interface useDocumentsFetchOptions {
  aggregatePages?: boolean
  withStatus?: boolean
  withPlannings?: boolean
  asAssignments?: boolean
  setTableData?: boolean
  subscribe?: boolean
}

class AbortError extends Error { }

/**
 * Custom hook to fetch and manage documents with optional subscription-based updates.
 *
 * @template T - The type of the documents being fetched.
 * @template F - The type of the fields being requested.
 *
 * @param {Object} params - Parameters for fetching documents.
 * @param {string} params.documentType - The type of documents to fetch.
 * @param {QueryV1} [params.query] - The query object to filter documents.
 * @param {F} [params.fields] - The fields to include in the response.
 * @param {number} [params.size] - The number of documents per page.
 * @param {number} [params.page] - The page number to fetch.
 * @param {SortingV1[]} [params.sort] - Sorting options for the documents.
 * @param {useDocumentsFetchOptions} [params.options] - Additional options for fetching documents.
 *
 * @returns {SWRResponse<T[], Error>} An object containing the fetched data, error, and SWR utilities.
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
  const [subscriptions, setSubscriptions] = useState<SubscriptionReference[]>()
  const subscriptionsRef = useRef<SubscriptionReference[] | undefined>(subscriptions)
  const mutateRef = useRef<KeyedMutator<T[]> | null>(null)
  const dataRef = useRef<T[] | undefined>(undefined)

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
      options,
      setSubscriptions
    }),
  [index, session, page, size, documentType, query, fields, sort, options])

  const { data, error, mutate, isLoading, isValidating } = useSWR<T[], Error>(key, fetcher)

  // Keep refs up to date for polling
  useEffect(() => {
    subscriptionsRef.current = subscriptions
    mutateRef.current = mutate
    dataRef.current = data
  }, [subscriptions, mutate, data])

  if (error) {
    console.error('Document fetch failed:', error)
    toast.error('Misslyckades hämta dokument.')
  }

  // Set table data after fetch
  useEffect(() => {
    if (data && setData && options?.setTableData) {
      setData(data)
    }
  }, [data, setData, options?.setTableData])

  const isPolling = useRef(false)

  const startPolling = async (
    index: Index,
    session: Session,
    abortController: AbortController
  ) => {
    while (isPolling.current) {
      try {
        subscriptionsRef.current = await pollSubscriptions({
          index,
          data: dataRef.current,
          accessToken: session.accessToken,
          subscriptions: subscriptionsRef.current ?? [],
          mutate: mutateRef.current!,
          abortController
        })
      } catch (error) {
        if (error instanceof AbortError) {
          break
        }
        const interval = getInterval(20, 30)

        console.error('Polling error:', error)
        toast.error(`Misslyckades att automatiskt uppdatera listan. Försöker igen om ${interval / 1000} sekunder.`)
        // Wait before next retry if failed
        await new Promise((resolve) => setTimeout(resolve, interval))
      }
    }
  }

  useEffect(() => {
    // Only start polling if all conditions are met
    if (
      !options?.subscribe
      || !session?.accessToken
      || !subscriptionsRef.current
      || !subscriptionsRef.current.length
      || !index
      || isPolling.current
    ) {
      return
    }
    isPolling.current = true

    const abortController = new AbortController()

    const handleBeforeUnload = () => {
      abortController.abort()
    }

    // Safari/iOS specific: https://bugs.webkit.org/show_bug.cgi?id=219102
    if (/iP(ad|hone|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
      window.addEventListener('unload', handleBeforeUnload)
    } else {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    void startPolling(index, session, abortController)
      .catch((ex) => {
        console.error('Unable to start polling', ex)
      })

    return () => {
      abortController.abort()
      isPolling.current = false
      if (/iP(ad|hone|od)|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
        window.removeEventListener('unload', handleBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
    // Only restart polling if these change
  }, [index, options?.subscribe, session, subscriptions])

  return { data, error, mutate, isValidating, isLoading }
}

async function pollSubscriptions<T extends HitV1>({
  index,
  accessToken,
  subscriptions,
  data = [],
  mutate,
  abortController
}: {
  index: Index
  data?: T[]
  accessToken: string
  subscriptions: SubscriptionReference[]
  mutate: KeyedMutator<T[]>
  abortController?: AbortController
}): Promise<SubscriptionReference[]> {
  try {
    const response: PollSubscriptionResponse = await index.pollSubscription({
      subscriptions,
      accessToken,
      abortSignal: abortController?.signal
    })

    // Collect new subscriptions and matched items
    const newSubscriptions: SubscriptionReference[] = []
    const matchedItems: SubscriptionItem[] = []

    response.result.forEach((group) => {
      if (group.subscription) {
        const groupMatchedItems = group.items.filter((item) => item.match)
        newSubscriptions.push(group.subscription)
        if (groupMatchedItems.length) {
          matchedItems.push(...groupMatchedItems)
        }
      }
    })

    // Check for changes in subscriptions, if not restart with old subscriptions
    if (!newSubscriptions.length) {
      return subscriptions
    }

    const dataIds = new Set(data.flatMap((obj) => obj?.id ? [obj.id] : []))
    // Check if any matched item is missing in data
    const missingMatch = matchedItems.some((item) => !dataIds.has(item.id))

    // if there are missing matches, we need to refetch the data
    if (missingMatch) {
      await mutate()
    } else {
      // Build a map of matched items by id for quick lookup
      const matchedMap = new Map<string, SubscriptionItem>(
        matchedItems.map((item) => [item.id, item])
      )
      // create a new array with updated fields and do a optimistic update
      const updatedData = data.map((obj) =>
        matchedMap.has(obj.id)
          ? {
              ...obj,
              fields: { ...obj.fields, ...matchedMap.get(obj.id)?.fields }
            }
          : obj
      )

      await mutate(updatedData, false)
    }

    return newSubscriptions
  } catch (error) {
    if (abortController?.signal.aborted) {
      throw new AbortError()
    }
    throw error
  }
}
