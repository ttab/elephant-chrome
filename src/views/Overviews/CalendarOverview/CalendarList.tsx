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


  const { data } = useSWR(searchUrl.href, async (): Promise<SearchIndexResponse | undefined> => {
    console.log('🍄 ~ const{data}=useSWR ~ data 🤭 -', data)
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
    setData(result)
    return result
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
