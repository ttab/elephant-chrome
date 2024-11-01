import { useCallback, useEffect, useRef } from 'react'
import { type SearchIndexResult, type SearchIndexError, type SearchIndexResponse } from '@/lib/index'
import { useSession } from 'next-auth/react'
import { type Session } from 'next-auth'
import { useIndexUrl } from './useIndexUrl'
import { useTable } from './useTable'
import { Events } from '@/lib/events'

interface FetchOptions {
  size: number
  page: number
  where: {
    start: string
    end: string
  }
}

export interface Fetcher<T extends Source> {
  search: (url: URL, token: string, options: FetchOptions) => Promise<SearchIndexResponse<T> | SearchIndexError>
}

export interface Source {
  _id: string
  _source: {
    created: string[]
    current_version: string[]
    'document.language': string[]
    'document.meta.status'?: string[]
  }
}

export const useFetcher = <T extends Source>(Fetcher: Fetcher<T>):
({ from, to, options }: {
  from: string
  to: string
  options?: {
    withStatus?: boolean
    withPlannings?: boolean
  }
}) => Promise<T[] | undefined> => {
  const { data: session } = useSession()
  const sessionRef = useRef<Session | null>(session)
  const { setData } = useTable<T>()

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const indexUrl = useIndexUrl()

  return useCallback(
    async ({ from, to, options }: {
      from: string
      to: string
      options?: {
        withStatus?: boolean
        withPlannings?: boolean
      }
    }): Promise<T[] | undefined> => {
      const currentSession = sessionRef.current
      if (!currentSession) return undefined

      const allResults: T[] = []
      let page = 1
      const size = 100

      try {
        while (true) {
          const result = await Fetcher.search(indexUrl, currentSession.accessToken, {
            size,
            page,
            where: { start: from, end: to }
          })


          if (!Array.isArray(result.hits)) {
            break
          }

          // Not ok, abort
          if (!result.ok) {
            throw new Error('Failed to fetch data', { cause: result })
          }

          // Append statuses
          if (options?.withStatus) {
            const itemsWithStatus: T[] = withStatus(result)

            allResults.push(...itemsWithStatus)

          // Append plannings
          } else if (options?.withPlannings) {
            if (!sessionRef.current) {
              throw new Error('Session is not available')
            }

            const itemsWithPlannings = await withPlannings({ result, session: sessionRef.current, from, to, indexUrl })

            allResults.push(...itemsWithPlannings)

          // return unalterated results
          } else {
            allResults.push(...result.hits)
          }

          if (result.hits.length < size) {
            break
          }

          page++
        }

        setData(allResults)
        return allResults
      } catch (ex) {
        throw new Error('Failed to fetch data', { cause: ex })
      }
    },
    [Fetcher, indexUrl, setData]
  )
}

function getCurrentDocumentStatus<T extends Source>(obj: T): string {
  const item: Record<string, null | string[]> = obj._source
  const defaultStatus = 'draft'
  const createdValues = []
  for (const key in item) {
    if (Array.isArray(item[key])) {
      if (Object.prototype.hasOwnProperty.call(item, key) && key.startsWith('heads.')) {
        let newkey = key.split('heads.')[1]
        if (newkey.includes('.created')) {
          newkey = newkey.replace('.created', '')
          const [dateCreated] = item[key]
          createdValues.push({ status: newkey, created: dateCreated })
        }
      }
    }
  }
  createdValues.sort((a, b) => a?.created > b?.created ? -1 : 1)
  return createdValues[0]?.status || defaultStatus
}

function withStatus<T extends Source>(result: SearchIndexResult<T>): T[] {
  return result?.hits?.map((item: T) => {
    const status = getCurrentDocumentStatus(item)
    item._source = {
      ...item._source,
      'document.meta.status': [status]
    }
    return item
  })
}

async function withPlannings<T extends Source>({ result, session, from, to, indexUrl }: {
  result: SearchIndexResponse<T>
  session: Session | null
  from: string
  to: string
  indexUrl: URL
}): Promise<T[]> {
  if (!session) return result.hits

  const eventIDs: string[] = result.hits?.map((hit) => hit?._id)
  const statusResults = await Events.relatedPlanningSearch(indexUrl, session.accessToken, eventIDs, {
    size: 100,
    where: {
      start: from,
      end: to
    }
  })
  const hasPlannings = statusResults.hits?.map((hit) => hit._source['document.rel.event.uuid'])
  const hitsWithPlannings = result.hits.map((hit) => {
    const relatedItemIndex = hasPlannings.findIndex((item) => item[0] === hit._id)
    if (relatedItemIndex !== -1) {
      return {
        ...hit,
        _relatedPlannings: hasPlannings[relatedItemIndex]
      }
    }
    return hit
  })

  return hitsWithPlannings
}

