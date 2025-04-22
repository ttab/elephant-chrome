import { Events } from '@/lib/events'
import { transformAssignments } from '../Assignments/lib/transformAssignments'
import { withStatus } from '@/hooks/useFetcher'
import {
  Articles,
  Assignments,
  Plannings,
  type Article,
  type Planning,
  type Event
} from '@/lib/index'
import type { AssignmentMetaExtended } from '../Assignments/types'
import type { Dispatch, SetStateAction } from 'react'
import type { QueryParams } from '@/hooks/useQuery'

export type DataType<T> = T[]
export type Types = Planning | Event | AssignmentMetaExtended | Article

interface Props {
  setLoading: React.Dispatch<SetStateAction<boolean>>
  setTotalHits: React.Dispatch<SetStateAction<number>>
  page: number
  text: string | undefined
  searchType: string
  accessToken: string | undefined
  indexUrl: URL
  setData: Dispatch<Array<Types>>
  status: string
  query: QueryParams
}

interface Params {
  page?: number
  size?: number
  when?: 'anytime' | 'fixed'
  query?: QueryParams
  where: {
    start?: string | Date
    end?: string | Date
    text: string
  }
  sort?: {
    start?: 'asc' | 'desc'
    end?: 'asc' | 'desc'
  }
}

export const search = ({
  text,
  page,
  setLoading,
  setTotalHits,
  searchType,
  accessToken,
  indexUrl,
  setData,
  status,
  query
}: Props): void => {
  void (async () => {
    if (!accessToken || status !== 'authenticated'/*  || (!text || text?.length < 1) */) {
      return
    }

    const params: Params = {
      when: 'anytime',
      page,
      size: 100,
      query,
      where: {
        text: text || ''
      }
    } as const

    try {
      const allData: DataType<Types> = []
      setLoading(true)
      const isPlanningOrEventSearch = searchType === 'plannings' || searchType === 'events'

      if (isPlanningOrEventSearch) {
        if (searchType === 'events') {
          /* in Plannings view we use the sort.start parameter to sort by assignment time,
          which should not be done in Search view. However, the same parameter in Events
          view can also be used in Search view to get correct sorting */
          params.sort = {
            start: 'desc'
          }
        }

        const result = searchType === 'plannings'
          ? await Plannings.search(indexUrl, accessToken, params)
          : await Events.search(indexUrl, accessToken, params)
        if (result.ok) {
          if (searchType === 'plannings') {
            const planningsWithstatus = withStatus<Planning | Event>(result)
            setTotalHits(planningsWithstatus.length)
            allData.push(...planningsWithstatus)
          } else {
            setTotalHits(result.total)
            allData.push(...result.hits)
          }
        }
      }

      if (searchType === 'assignments') {
        const endpoint = new URL('/twirp/elephant.index.SearchV1/Query', indexUrl)
        const result = await Assignments.search({ endpoint, accessToken, text, page, paramsQuery: query })
        const assignments: AssignmentMetaExtended[] = transformAssignments(result)
        setTotalHits(assignments.length)
        allData.push(...assignments)
      }

      if (searchType === 'articles') {
        const result = await Articles.search(indexUrl, accessToken, params)
        if (result.ok) {
          setTotalHits(result.total)
          allData.push(...result.hits)
        }
      }
      setData(allData)
      setLoading(false)
    } catch (error) {
      console.error('Search error', error)
      setLoading(false)
    }
  })()
}
