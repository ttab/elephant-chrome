import { Article, Articles, Assignments, Event, Planning, Plannings } from "@/lib/index"
import { Events } from "@/lib/events"
import { transformAssignments } from "../Assignments/lib/transformAssignments"
import { withStatus } from "@/hooks/useFetcher"
import { type AssignmentMetaExtended } from "../Assignments/types"
import { type Session } from 'next-auth'
import { type Dispatch, type SetStateAction } from "react"

interface Props {
  setLoading: React.Dispatch<SetStateAction<boolean>>
  setTotalHits: React.Dispatch<SetStateAction<number>>
  page: number
  text: string | undefined
  pool: string
  session: Session | null
  indexUrl: URL
  setData: Dispatch<Array<Planning | Event | AssignmentMetaExtended | Article>>
  status: string
}

export const search = ({
  text,
  page,
  setLoading,
  setTotalHits,
  pool,
  session,
  indexUrl,
  setData,
  status
}: Props) => {
  void (async () => {
    if (!session?.accessToken || status !== 'authenticated') {
      return
    }
    if (!text || text?.length < 1) {
      return
    }
    const params = {
      when: 'anytime',
      page,
      size: 100,
      where: {
        text
      },
      sort: {
        start: 'desc'
      }
    } as const

    try {
      let allData: Array<Planning | Event | Article | AssignmentMetaExtended> = []
      setLoading(true)
      const isPlanningOrEventSearch = pool === 'plannings' || pool === 'events'
      if (isPlanningOrEventSearch) {
        const result = pool === 'plannings'
          ? await Plannings.search(indexUrl, session.accessToken, params)
          : await Events.search(indexUrl, session.accessToken, params)
        if (result.ok) {
          if (pool === 'plannings') {
            const planningsWithstatus = withStatus(result)
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
        const result = await Assignments.search({ endpoint, accessToken: session.accessToken, text, page })
        const assignments: AssignmentMetaExtended[] = transformAssignments(result)
        setTotalHits(assignments.length)
        allData.push(...assignments)
      }
      if (pool === 'articles') {
        const result = await Articles.search(indexUrl, session.accessToken, params)
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