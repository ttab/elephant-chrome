import { useCallback, useEffect, useRef } from 'react'
import { type SearchIndexResult, type SearchIndexError, type SearchIndexResponse, type PlanningSearchParams } from '@/lib/index'
import { useSession } from 'next-auth/react'
import { type Session } from 'next-auth'
import { useIndexUrl } from './useIndexUrl'
import { useTable } from './useTable'
import { Events } from '@/lib/events'

export interface Fetcher<T extends Source, R> {
  search: (url: URL, token: string, options: R) => Promise<SearchIndexResponse<T> | SearchIndexError>
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

function hasPagination(params: unknown): params is { page: string } {
  return typeof (params as { page: string }).page === 'string'
}

export const useFetcher = <T extends Source, R>(Fetcher: Fetcher<T, R>):
({ params, options }: {
  params: R
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
    async ({ params, options }: {
      params: R
      options?: {
        withStatus?: boolean
        withPlannings?: boolean
      }
    }): Promise<T[] | undefined> => {
      const currentSession = sessionRef.current
      if (!currentSession) return undefined

      const allResults: T[] = []
      let page = 1

      if (hasPagination(params)) {
        page = Number(params.page)
      }

      const size = 100

      try {
        while (true) {
          const result = await Fetcher.search(indexUrl, currentSession.accessToken, {
            ...params,
            page
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

            const itemsWithPlannings = await withPlannings({
              result,
              session: sessionRef.current,
              params: params as PlanningSearchParams,
              indexUrl
            })

            allResults.push(...itemsWithPlannings)

          // return unalterated results
          } else {
            allResults.push(...result.hits)
          }

          if (result.hits.length < size || hasPagination(params)) {
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

export function withStatus<T extends Source>(result: SearchIndexResult<T>): T[] {
  return result?.hits?.map((item: T) => {
    const status = getCurrentDocumentStatus(item)
    item._source = {
      ...item._source,
      'document.meta.status': [status]
    }
    return item
  })
}

async function withPlannings<T extends Source>({ result, session, params, indexUrl }: {
  result: SearchIndexResponse<T>
  session: Session | null
  params: PlanningSearchParams
  indexUrl: URL
}): Promise<T[]> {
  if (!session) return result.hits

  const eventIDs: string[] = result.hits?.map((hit) => hit?._id)
  const statusResults = await Events.relatedPlanningSearch(indexUrl, session.accessToken, eventIDs, {
    size: 100,
    where: {
      start: params?.where?.start,
      end: params?.where?.end
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

