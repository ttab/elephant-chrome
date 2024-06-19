import { useMemo } from 'react'
import useSWR from 'swr'

import { useIndexUrl, usePlanningTable } from '@/hooks'
import { useSession } from 'next-auth/react'
import { type SearchIndexResponse } from '@/lib/index/planning-search'
import { Planning } from '@/lib/planning'
import { PlanningTable } from '@/views/PlanningOverview/PlanningTable'
import { columns } from '@/views/PlanningOverview/PlanningTable/Columns'

import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'

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


  const { data } = useSWR(['planningitems', status, searchUrl.href], async (): Promise<SearchIndexResponse | undefined> => {
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
      setData(result)
      return result
    }
  })


  return (
    <>
      {data?.ok === true &&
        <PlanningTable data={data?.hits} columns={columns} onRowSelected={(row): void => {
          if (row) {
            console.log(`Selected planning item ${row._id}`)
          } else {
            console.log('Deselected row')
          }
        }} />
      }
    </>
  )
}
