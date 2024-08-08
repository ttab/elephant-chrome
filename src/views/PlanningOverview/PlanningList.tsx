import { useMemo } from 'react'
import useSWR from 'swr'
import { useIndexUrl, usePlanningTable, useRepositoryEvents } from '@/hooks'
import { useSession } from 'next-auth/react'
import {
  type SearchIndexResponse,
  type Planning as PlanningType,
  Plannings
} from '@/lib/index'

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
    if (!indexUrl) {
      return
    }

    const start = convertToISOStringInUTC(startTime)
    const end = convertToISOStringInUTC(endTime)
    const searchUrl = new URL(indexUrl)

    searchUrl.search = new URLSearchParams({ start, end }).toString()
    return searchUrl
  }, [startTime, endTime, indexUrl])

  const { data, mutate } = useSWR(searchUrl?.href, async (): Promise<SearchIndexResponse<PlanningType> | undefined> => {
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
      try {
        const getCurrentDocumentStatus = (obj: PlanningType): string => {
          const item = obj._source
          const result: Record<string, string[]> = {}
          const defaultStatus = 'draft'
          for (const key in item) {
            if (Object.prototype.hasOwnProperty.call(item, key) && key.startsWith('heads.')) {
              const newkey = key.split('heads.')[1]
              result[newkey] = (item as Record<string, any>)[key]
            }
          }
          const createdValues = []
          for (const key in result) {
            if (key.includes('.created')) {
              const dateCreated = result[key][0]
              createdValues.push({ status: key.replace('.created', ''), created: dateCreated })
            }
          }
          createdValues.sort((a, b) => a?.created > b?.created ? -1 : 1)
          return createdValues[0]?.status || defaultStatus
        }
        const planningsWithStatus = {
          ...result,
          hits: result?.hits?.map((planningItem: PlanningType) => {
            const status = getCurrentDocumentStatus(planningItem)
            planningItem._source = Object.assign({}, planningItem._source, {
              'document.meta.status': [status]
            })
            return planningItem
          })
        }
        setData(planningsWithStatus)
        return planningsWithStatus
      } catch (error) {
        console.error(error)
      }
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
        <PlanningTable data={data?.hits} columns={columns} onRowSelected={(row): void => {
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
