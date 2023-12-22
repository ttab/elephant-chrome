import { useSession, useApi, useRegistry } from '@/hooks'
import { type SearchIndexResponse } from '@/lib/index/search'
import { Planning } from '@/lib/planning'
import { PlanningTable } from '@/views/PlanningOverview/PlanningTable'
import { columns } from '@/views/PlanningOverview/PlanningTable/Columns'

import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import useSWR from 'swr'
import { useMemo } from 'react'

export const PlanningList = ({ date }: { date: Date }): JSX.Element => {
  const { locale } = useRegistry()
  const { jwt } = useSession()
  const { indexUrl } = useApi()
  const { startTime, endTime } = getDateTimeBoundaries(date)

  // Create url to base SWR caching on
  const searchUrl = useMemo(() => {
    const start = convertToISOStringInUTC(startTime, locale)
    const end = convertToISOStringInUTC(endTime, locale)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl, locale])


  const { data } = useSWR(searchUrl.href, async (): Promise<SearchIndexResponse | undefined> => {
    if (!jwt) {
      return
    }

    const { startTime, endTime } = getDateTimeBoundaries(date)
    return await Planning.search(indexUrl, jwt, {
      size: 100,
      where: {
        start: convertToISOStringInUTC(startTime, locale),
        end: convertToISOStringInUTC(endTime, locale)
      }
    })
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
