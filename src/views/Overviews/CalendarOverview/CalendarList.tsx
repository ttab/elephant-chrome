import { useMemo } from 'react'
import useSWR from 'swr'

import { useRegistry, useIndexUrl, useCalendarTable } from '@/hooks'
import { useSession } from 'next-auth/react'
import { type CalendarSearchIndexResponse } from '@/lib/index/calendar-search'
import { Calendar } from '@/lib/calendar'
import { columns } from '@/views/Overviews/CalendarOverview/CalendarTable/Columns'

import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { CalendarTable } from './CalendarTable'

export const CalendarList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = useCalendarTable()
  const { locale } = useRegistry()
  const { data: session, status } = useSession()

  const indexUrl = useIndexUrl()
  const { startTime, endTime } = getDateTimeBoundaries(date)

  // Create url to base SWR caching on
  const searchUrl = useMemo(() => {
    const start = convertToISOStringInUTC(startTime, locale)
    const end = convertToISOStringInUTC(endTime, locale)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl, locale])


  const { data } = useSWR(['calendaritems', status, searchUrl.href], async (): Promise<CalendarSearchIndexResponse & { planningItem?: string } | undefined> => {
    if (status !== 'authenticated') {
      return
    }

    const { startTime, endTime } = getDateTimeBoundaries(date)
    const result = await Calendar.search(indexUrl, session.accessToken, {
      sort: { start: 'asc' },
      size: 100,
      where: {
        start: convertToISOStringInUTC(startTime, locale),
        end: convertToISOStringInUTC(endTime, locale)
      }
    })
    if (result?.ok) {
      const eventIDs = result.hits?.map(hit => hit?._id)
      const statusResults = await Calendar.relatedPlanningSearch(indexUrl, session.accessToken, eventIDs, {
        size: 100,
        where: {
          start: convertToISOStringInUTC(startTime, locale),
          end: convertToISOStringInUTC(endTime, locale)
        }
      })
      const hasPlannings = statusResults.hits?.map(hit => hit._source['document.rel.event.uuid'])
      const hitsWithPlannings = result.hits.map(hit => {
        const relatedItemIndex = hasPlannings.findIndex(item => item[0] === hit._id)
        if (relatedItemIndex !== -1) {
          return {
            ...hit,
            _relatedPlannings: hasPlannings[relatedItemIndex]
          }
        }
        return hit
      })

      result.hits = hitsWithPlannings

      setData(result)
      return result
    }
  })


  return (
    <>
      {data?.ok === true &&
        <CalendarTable data={data?.hits} columns={columns} onRowSelected={(row): void => {
          if (row) {
            console.log(`Selected event item ${row._id}`)
          } else {
            console.log('Deselected row')
          }
        }} />
      }
    </>
  )
}
