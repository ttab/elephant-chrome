import { type SearchIndexResponse } from '@/lib/index/search'
import { Planning } from '@/lib/planning'
// import { useEffect } from 'react'
import { type Planning as PlanningType } from '@/components/PlanningTable/data/schema'

import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { PlanningGridColumn } from './PlanningGridColumn'
import { useSession, useApi, useRegistry } from '@/hooks'
import { convertToISOStringInTimeZone, convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import useSWR from 'swr'
import { useMemo } from 'react'

type PlanningsByDate = Record<string, PlanningType[]>

interface PlanningGridProps {
  startDate: Date
  endDate: Date
}

export const PlanningGrid = ({ startDate, endDate }: PlanningGridProps): JSX.Element => {
  const { indexUrl } = useApi()
  const { jwt } = useSession()
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

  const { data } = useSWR(searchUrl.href, async (): Promise<PlanningsByDate | undefined> => {
    if (!jwt) {
      return
    }

    const result = await Planning.search(indexUrl, jwt, {
      size: 500,
      where: {
        start: searchUrl.searchParams.get('start') as string,
        end: searchUrl.searchParams.get('end') as string
      },
      sort: {
        start: 'asc'
      }
    })

    return (result?.ok) ? structureByDate(result, startTime, endTime, locale, timeZone) : undefined
  })

  const grid = cva('grid grid-cols-1', {
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

  const colSpan = (Object.keys(data || {}).length || 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7

  return (
    <div className={cn(grid({ size: colSpan }))}>
      {Object.keys(data).sort((dt1, dt2) => { return dt1 > dt2 ? 1 : -1 }).map((key) => (
        <PlanningGridColumn key={key} date={new Date(key)} items={data[key]} />
      ))}
    </div>
  )
}


function structureByDate(result: SearchIndexResponse, startTime: Date, endTime: Date, locale: string, timeZone: string): PlanningsByDate | undefined {
  const plannings: PlanningsByDate = {}

  if (!Array.isArray(result?.hits)) {
    return
  }

  for (const item of result.hits) {
    // A planning item can have assignments outside of the wanted period. Filter and sort
    // so that we have an ordered list of assignment dates within the wanted period
    const assignmentDatesInInterval = item._source['document.meta.core_assignment.data.start'].map(strDate => {
      return new Date(strDate)
    }).filter((date) => {
      return date >= startTime && date <= endTime
    }).sort((dt1, dt2) => {
      return dt1 > dt2 ? 1 : -1
    })

    const localStart = convertToISOStringInTimeZone(
      assignmentDatesInInterval[0],
      locale,
      timeZone
    )
    const date = localStart.substring(0, 10)
    if (!Array.isArray(plannings[date])) {
      plannings[date] = []
    }

    plannings[date].push(item)
  }

  return plannings
}
