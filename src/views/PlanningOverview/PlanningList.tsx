import { useMemo } from 'react'
import useSWR from 'swr'
import { useIndexUrl, useTable, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import {
  type SearchIndexResponse,
  type Planning,
  Plannings
} from '@/lib/index'

import { PlanningTable } from '@/views/PlanningOverview/PlanningTable'
import { planningColumns } from '@/views/PlanningOverview/PlanningTable/Columns'
import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'

export const PlanningList = ({ date }: { date: Date }): JSX.Element => {
  const { setData } = useTable<Planning>()
  const { data: session, status } = useSession()

  const indexUrl = useIndexUrl()
  const { startTime, endTime } = getDateTimeBoundaries(date)

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

  const { data, mutate } = useSWR(searchUrl?.href, async (): Promise<SearchIndexResponse<Planning> | undefined> => {
    if (status !== 'authenticated' || !indexUrl) {
      return
    }

    const { startTime, endTime } = getDateTimeBoundaries(date)
    const result = await Plannings.search(indexUrl, session.accessToken, {
      size: 100,
      where: {
        start: convertToISOStringInUTC(startTime),
        end: convertToISOStringInUTC(endTime)
      }
    })
    if (result.ok) {
      const getCurrentDocumentStatus = (obj: Planning): string => {
        const item: Record<string, null | string[]> = obj._source
        const defaultStatus = 'draft'
        const createdValues = []
        for (const key in item) {
          if (Array.isArray(item[key])) {
            if (Object.prototype.hasOwnProperty.call(item, key) && key.startsWith('heads.')) {
              let newkey = key.split('heads.')[1]
              if (newkey.includes('.created')) {
                newkey = newkey.replace('.created', '')
                const [dateCreated] = item[key]
                createdValues.push({ status: newkey, created: dateCreated })
              }
            }
          }
        }
        createdValues.sort((a, b) => a?.created > b?.created ? -1 : 1)
        return createdValues[0]?.status || defaultStatus
      }
      const planningsWithStatus = {
        ...result,
        hits: result?.hits?.map((planningItem: Planning) => {
          const status = getCurrentDocumentStatus(planningItem)
          planningItem._source = Object.assign({}, planningItem._source, {
            'document.meta.status': [status]
          })
          return planningItem
        })
      }
      setData(planningsWithStatus)
      return planningsWithStatus
    }
  })

  useRepositoryEvents('core/planning-item', () => {
    void (async () => {
      try {
        await mutate()
      } catch (error) {
        console.error('Error when mutating Planning list', error)
      }
    })()
  })

  return (
    <>
      {data?.ok === true &&
        <PlanningTable data={data?.hits} columns={planningColumns} onRowSelected={(row): void => {
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
