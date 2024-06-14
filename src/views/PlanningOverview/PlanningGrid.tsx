import { type SearchIndexResponse } from '@/lib/index/search'
import { Planning } from '@/lib/planning'
import { type Planning as PlanningType } from '@/views/PlanningOverview/PlanningTable/data/schema'

import { cn } from '@ttab/elephant-ui/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { PlanningGridColumn } from './PlanningGridColumn'
import { useRegistry, useIndexUrl } from '@/hooks'
import { useSession } from 'next-auth/react'
import { convertToISOStringInTimeZone, convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import useSWR from 'swr'
import { useMemo } from 'react'

type PlanningsByDate = Record<string, PlanningType[]>

interface PlanningGridProps {
  startDate: Date
  endDate: Date
}

export const PlanningGrid = ({ startDate, endDate }: PlanningGridProps): JSX.Element => {
  const indexUrl = useIndexUrl()
  const { data: session, status } = useSession()
  const { timeZone } = useRegistry()
  const { startTime } = getDateTimeBoundaries(startDate)
  const { endTime } = getDateTimeBoundaries(endDate)

  // Create url to base SWR caching on
  const searchUrl = useMemo(() => {
    const start = convertToISOStringInUTC(startTime)
    const end = convertToISOStringInUTC(endTime)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl])

  const { data } = useSWR(searchUrl.href, async (): Promise<PlanningsByDate | undefined> => {
    if (status !== 'authenticated') {
      return
    }
    const start = searchUrl.searchParams.get('start')
    const end = searchUrl.searchParams.get('end')

    if (start === null || end === null) {
      throw new Error('Start or end cant be null')
    }

    const result = await Planning.search(indexUrl, session.accessToken, {
      size: 500,
      where: {
        start,
        end
      },
      sort: {
        start: 'asc'
      }
    })

    return (result?.ok) ? structureByDate(result, startTime, endTime, timeZone) : undefined
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
        <PlanningGridColumn key={key} date={new Date(key)} items={data[key]} />
      ))}
    </div>
  )
}


function structureByDate(result: SearchIndexResponse, startTime: Date, endTime: Date, timeZone: string): PlanningsByDate | undefined {
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
