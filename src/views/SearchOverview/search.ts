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
import { type AssignmentMetaExtended } from '../Assignments/types'
import { type Dispatch, type SetStateAction } from 'react'

interface Props {
  setLoading: React.Dispatch<SetStateAction<boolean>>
  setTotalHits: React.Dispatch<SetStateAction<number>>
  page: number
  text: string | undefined
  pool: string
  accessToken: string | undefined
  indexUrl: URL
  setData: Dispatch<Array<Planning | Event | AssignmentMetaExtended | Article>>
  status: string
}

interface Params {
  page?: number
  size?: number
  when?: 'anytime' | 'fixed'
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
  pool,
  accessToken,
  indexUrl,
  setData,
  status
}: Props): void => {
  void (async () => {
    if (!accessToken || status !== 'authenticated' || (!text || text?.length < 1)) {
      return
    }
    const params: Params = {
      when: 'anytime',
      page,
      size: 100,
      where: {
        text
      }
    } as const

    try {
      const allData: Array<Planning | Event | Article | AssignmentMetaExtended> = []
      setLoading(true)
      const isPlanningOrEventSearch = pool === 'plannings' || pool === 'events'
      if (isPlanningOrEventSearch) {
        if (pool === 'events') {
          // in Plannings view we use the sort.start parameter to sort by assignment time,
          // which should not be done in Search view
          params.sort = {
            start: 'desc'
          }
        }
        const result = pool === 'plannings'
          ? await Plannings.search(indexUrl, accessToken, params)
          : await Events.search(indexUrl, accessToken, params)
        if (result.ok) {
          if (pool === 'plannings') {
            const planningsWithstatus = withStatus<any>(result)
            setTotalHits(planningsWithstatus.length)
            allData.push(...planningsWithstatus)
          } else {
            setTotalHits(result.total)
            allData.push(...result.hits)
          }
        }
      }
      if (pool === 'assignments') {
        const endpoint = new URL('/twirp/elephant.index.SearchV1/Query', indexUrl)
        const result = await Assignments.search({ endpoint, accessToken, text, page })
        const assignments: AssignmentMetaExtended[] = transformAssignments(result)
        setTotalHits(assignments.length)
        allData.push(...assignments)
      }
      if (pool === 'articles') {
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
