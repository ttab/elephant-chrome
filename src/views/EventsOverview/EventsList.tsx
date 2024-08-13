import { useMemo } from 'react'
import useSWR from 'swr'

import { useIndexUrl, useTable } from '@/hooks'
import { useSession } from 'next-auth/react'
import { type SearchIndexResponse } from '@/lib/index/searchIndex'
import { Events } from '@/lib/events'
import { type Event } from '@/lib/index/schemas'
import { eventColumns } from '@/views/EventsOverview/EventsTable/Columns'

import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { EventsTable } from './EventsTable'

export const EventsList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = useTable<Event>()
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


  const { data } = useSWR(['eventitems', status, searchUrl.href], async (): Promise<SearchIndexResponse<Event> & { planningItem?: string } | undefined> => {
    if (status !== 'authenticated') {
      return
    }

    const { startTime, endTime } = getDateTimeBoundaries(date)
    const result = await Events.search(indexUrl, session.accessToken, {
      sort: { start: 'asc' },
      size: 100,
      where: {
        start: convertToISOStringInUTC(startTime),
        end: convertToISOStringInUTC(endTime)
      }
    })
    if (result?.ok) {
      const eventIDs = result.hits?.map(hit => hit?._id)
      const statusResults = await Events.relatedPlanningSearch(indexUrl, session.accessToken, eventIDs, {
        size: 100,
        where: {
          start: convertToISOStringInUTC(startTime),
          end: convertToISOStringInUTC(endTime)
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
        <EventsTable data={data?.hits} columns={eventColumns} onRowSelected={(row): void => {
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
