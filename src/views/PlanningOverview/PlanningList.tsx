import { useSession, useApi } from '@/hooks'
import { type SearchIndexResponse } from '@/lib/index/search'
import { Planning } from '@/lib/planning'
import { PlanningTable } from '@/components/PlanningTable'
import { columns } from '@/components/PlanningTable/Columns'

import { convertToISOStringInUTC, getDateTimeBoundaries } from '@/lib/datetime'
import { useRegistry } from '@/contexts/RegistryProvider'
import useSWR from 'swr'

export const PlanningList = ({ date }: { date: Date }): JSX.Element => {
  const { locale } = useRegistry()
  const { jwt } = useSession()
  const { indexUrl } = useApi()

  const { data } = useSWR(indexUrl, async (): Promise<SearchIndexResponse | undefined> => {
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
        <PlanningTable data={data?.hits} columns={columns} />
      }
    </>
  )
}
