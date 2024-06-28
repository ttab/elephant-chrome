import { useMemo } from 'react'
import useSWR from 'swr'

import { useIndexUrl, usePlanningTable } from '@/hooks'
import { useSession } from 'next-auth/react'
import { type SearchIndexResponse } from '@/lib/index/planning-search'
import { Planning } from '@/lib/planning'
import { Repository } from '@/lib/repository'
import { PlanningTable } from '@/views/PlanningOverview/PlanningTable'
import { columns } from '@/views/PlanningOverview/PlanningTable/Columns'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { type Planning as PlanningType } from './PlanningTable/data/schema'

export const PlanningList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = usePlanningTable()
  const { data: session, status } = useSession()

  const indexUrl = useIndexUrl()
  const { startTime, endTime } = getDateTimeBoundaries(date)

  // Create url to base SWR caching on
  const searchUrl = useMemo(() => {
    const start = convertToISOStringInUTC(startTime)
    const end = convertToISOStringInUTC(endTime)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl])


  const { data } = useSWR([status, searchUrl.href], async (): Promise<SearchIndexResponse | undefined> => {
    if (status !== 'authenticated') {
      return
    }

    const { startTime, endTime } = getDateTimeBoundaries(date)
    const result = await Planning.search(indexUrl, session.accessToken, {
      size: 100,
      where: {
        start: convertToISOStringInUTC(startTime),
        end: convertToISOStringInUTC(endTime)
      }
    })
    if (result.ok) {
      const documentIds = result?.hits.map(hit => hit._id)
      try {
        const metaResult = await Promise.all(documentIds?.map(async (documentId: string) => {
          const metaResponse = await Repository.metaSearch({ session, documentId })
          return { ...metaResponse, documentId }
        }))
        const planningsWithMeta = {
          ...result,
          hits: result?.hits?.map((planningItem: PlanningType) => {
            const documentId = planningItem?._id
            const _meta = metaResult?.find(metaItem => metaItem.documentId === documentId)
            const heads = _meta?.meta?.heads
            const status = Object?.keys(heads || {})[0]
            planningItem._source = Object.assign({}, planningItem._source, {
              'document.meta.status': [status]
            })
            return planningItem
          })
        }
        setData(planningsWithMeta)
        return planningsWithMeta
      } catch (error) {
        console.error(error)
      }
    }
  })


  return (
    <>
      {data?.ok === true &&
        <PlanningTable data={data?.hits} columns={columns} onRowSelected={(row): void => {
          if (row) {
            console.info(`Selected planning item ${row._id}`)
          } else {
            console.info('Deselected row')
          }
        }} />
      }
    </>
  )
}
