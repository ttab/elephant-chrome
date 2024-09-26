import { type Dispatch, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import { useIndexUrl, useTable, useSections, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import {
  type SearchIndexResponse,
  type Planning,
  Plannings
} from '@/lib/index'

import { Table } from '@/components/Table'
import { planningTableColumns } from '@/views/PlanningOverview/PlanningListColumns'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'

const getCurrentDocumentStatus = (obj: Planning): string => {
  const item: Record<string, null | string[]> = obj._source
  const defaultStatus = 'draft'

  const createdValues = Object.keys(item)
    .filter(key => key.startsWith('heads.') && key.includes('.created'))
    .map(key => {
      const newkey = key.replace('heads.', '').replace('.created', '')
      const dateCreated = item[key] ? item[key][0] : null
      return { status: newkey, created: dateCreated }
    })

  createdValues.sort((a, b) => {
    if (a.created === null) return 1
    if (b.created === null) return -1
    return a.created > b.created ? -1 : 1
  })

  return createdValues[0]?.status || defaultStatus
}

const fetchPlannings = async (
  setData: Dispatch<SearchIndexResponse<Planning>>,
  indexUrl: URL,
  session: Session | null,
  date: Date
): Promise<SearchIndexResponse<Planning> | undefined> => {
  if (!session) return undefined

  const { startTime, endTime } = getDateTimeBoundaries(date)
  const result = await Plannings.search(indexUrl, session.accessToken, {
    size: 100,
    where: {
      start: convertToISOStringInUTC(startTime),
      end: convertToISOStringInUTC(endTime)
    }
  })

  if (result.ok) {
    const planningsWithStatus = {
      ...result,
      hits: result?.hits?.map((planningItem: Planning) => {
        const status = getCurrentDocumentStatus(planningItem)
        planningItem._source = {
          ...planningItem._source,
          'document.meta.status': [status]
        }
        return planningItem
      })
    }
    setData(planningsWithStatus)
    return planningsWithStatus
  }
}

export const PlanningList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = useTable<Planning>()
  const { data: session } = useSession()

  const sections = useSections()
  const indexUrl = useIndexUrl()
  const { startTime, endTime } = getDateTimeBoundaries(date)

  const columns = useMemo(() => planningTableColumns({ sections }), [sections])

  // Create url to base SWR caching on
  const searchUrl = useMemo(() => {
    if (!indexUrl) {
      return
    }

    const start = convertToISOStringInUTC(startTime)
    const end = convertToISOStringInUTC(endTime)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl])

  const { data, mutate } = useSWR(
    searchUrl?.href, async () =>
      await fetchPlannings(setData, indexUrl, session, date), {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    })

  // FIXME: This should be supported by the useRepositoryEvents hook
  // but isn't working right now. The message goes only to the leader tab
  useRepositoryEvents(
    'core/planning-item',
    useCallback(() => {
      void (async () => {
        try {
          await mutate()
        } catch (error) {
          console.error('Error when mutating Planning list', error)
        }
      })()
    }, [mutate])
  )

  const onRowSelected = useCallback((row?: Planning) => {
    if (row) {
      console.info(`Selected planning item ${row._id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  return (
    <>
      {data?.ok &&
        <Table
          type='Planning'
          columns={columns}
          onRowSelected={onRowSelected}
        />
      }
    </>
  )
}
