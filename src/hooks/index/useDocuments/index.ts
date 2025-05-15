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
      options,
      setSubscriptions
    }),
  [index, session, page, size, documentType, query, fields, sort, options])

  const { data, error, mutate, isLoading, isValidating } = useSWR<T[], Error>(key, fetcher)

  if (error) {
    console.error('Document fetch failed:', error)
    toast.error('Misslyckades hämta dokument.')
  }

  // We need to wait after initial render to set the data
  useEffect(() => {
    if (data && setData && options?.setTableData) {
      setData(data)
    }
  }, [data, setData, options?.setTableData])

  // subscribe to changes using long polling
  const isPolling = useRef(false)
  useEffect(() => {
    if (!options?.subscribe || !session?.accessToken || !subscriptions?.length || !index || isPolling.current) {
      return
    }
    isPolling.current = true

    const abortController = new AbortController()

    const startPolling = async () => {
      let lastSubscriptions = subscriptions
      while (isPolling.current) {
        try {
          lastSubscriptions = await pollSubscriptions({
            index,
            data,
            accessToken: session.accessToken,
            subscriptions: lastSubscriptions,
            mutate,
            abortController
          })
        } catch (error) {
          if (error instanceof AbortError) {
            break
          }

          console.error('Polling error:', error)
          toast.error('Misslyckades att automatiskt uppdatera listan. Försöker igen om 30 sekunder.')

          // Wait before next retry if failed
          await new Promise((resolve) => setTimeout(resolve, 30000))
        }
      }
    }

    void startPolling()
      .catch((ex) => {
        console.error('Unable to start polling', ex)
      })

    return () => {
      // Call the abortController which causes a AbortError and breaks the loop, restart.
      abortController.abort()
      isPolling.current = false
    }
  }, [index, options?.subscribe, session?.accessToken, subscriptions, mutate, data])

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
        if (groupMatchedItems.length) {
          newSubscriptions.push(group.subscription)
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

      console.log('soft mutate', newSubscriptions.map((s) => s.cursor))
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
