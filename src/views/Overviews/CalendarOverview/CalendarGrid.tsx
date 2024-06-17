import { type CalendarSearchIndexResult } from '@/lib/index/calendar-search'
import { Calendar } from '@/lib/calendar'
import { type Calendar as CalendarType } from '@/views/Overviews/CalendarOverview/CalendarTable/data/schema'

import { cn } from '@ttab/elephant-ui/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { CalendarGridColumn } from './CalendarGridColumn'
import { useRegistry, useIndexUrl } from '@/hooks'
import { useSession } from 'next-auth/react'
import { convertToISOStringInTimeZone, convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import useSWR from 'swr'
import { useMemo } from 'react'

type EventsByDate = Record<string, CalendarType[]>

interface CalendarGridProps {
  startDate: Date
  endDate: Date
}

export const CalendarGrid = ({ startDate, endDate }: CalendarGridProps): JSX.Element => {
  const indexUrl = useIndexUrl()
  const { data: session, status } = useSession()
  const { locale, timeZone } = useRegistry()
  const { startTime } = getDateTimeBoundaries(startDate)
  const { endTime } = getDateTimeBoundaries(endDate)

  // Create url to base SWR caching on
  const searchUrl = useMemo(() => {
    const start = convertToISOStringInUTC(startTime, locale)
    const end = convertToISOStringInUTC(endTime, locale)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl, locale])

  const { data } = useSWR(searchUrl.href, async (): Promise<EventsByDate | undefined> => {
    if (status !== 'authenticated') {
      return
    }
    const start = searchUrl.searchParams.get('start')
    const end = searchUrl.searchParams.get('end')

    if (start === null || end === null) {
      throw new Error('Start or end cant be null')
    }

    const result = await Calendar.search(indexUrl, session.accessToken, {
      size: 500,
      where: {
        start,
        end
      },
      sort: {
        start: 'asc'
      }
    })

    return (result?.ok) ? structureByDate(result, startTime, endTime, locale, timeZone) : undefined
  })

  type GridVariantsProps = VariantProps<typeof gridVariants>
  type GridSize = Extract<1 | 2 | 3 | 4 | 5 | 6 | 7, GridVariantsProps['size']>

  const gridVariants = cva('grid grid-cols-1', {
    variants: {
      size: {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
        7: 'grid-cols-7'
      }
    }
  })

  if (data === undefined) {
    return <></>
  }

  const gridProps = {
    size: (Object.keys(data || {}).length || 1) as GridSize
  }

  return (
    <div className={cn(gridVariants(gridProps))}>
      {Object.keys(data).sort((dt1, dt2) => { return dt1 > dt2 ? 1 : -1 }).map((key) => (
        <CalendarGridColumn key={key} date={new Date(key)} items={data[key]} />
      ))}
    </div>
  )
}


function structureByDate(result: CalendarSearchIndexResult, startTime: Date, endTime: Date, locale: string, timeZone: string): EventsByDate | undefined {
  const events: EventsByDate = {}

  if (!Array.isArray(result?.hits)) {
    return
  }

  for (const item of result.hits) {
    // A planning item can have assignments outside of the wanted period. Filter and sort
    // so that we have an ordered list of assignment dates within the wanted period
    const assignmentDatesInInterval: Date[] = item._source['document.meta.core_event.data.start'].map((strDate: string) => {
      return new Date(strDate)
    }).filter((date: Date) => {
      return date >= startTime && date <= endTime
    }).sort((dt1: Date, dt2: Date) => {
      return dt1 > dt2 ? 1 : -1
    })

    const localStart = convertToISOStringInTimeZone(
      assignmentDatesInInterval[0],
      locale,
      timeZone
    )
    const date = localStart.substring(0, 10)
    if (!Array.isArray(events[date])) {
      events[date] = []
    }

    events[date].push(item)
  }

  return events
}
