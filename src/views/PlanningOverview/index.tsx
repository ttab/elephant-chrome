import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import { useApi } from '@/hooks/useApi'
import { type SearchIndexResponse } from '@/lib/index/search'
import { Planning } from '@/lib/planning'
import { type ViewProps } from '@/types'
import { useEffect, useState } from 'react'

import { PlanningHeader } from '@/components/PlanningHeader'
import { PlanningTable } from '@/components/PlanningTable'
import { columns } from '@/components/PlanningTable/Columns'
import {
  Tabs,
  TabsContent
} from '@ttab/elephant-ui'

export const PlanningOverview = (props: ViewProps): JSX.Element => {
  const { jwt } = useSession()
  const { indexUrl } = useApi()
  const [result, setResult] = useState<SearchIndexResponse | undefined>()
  const sDate = new Date()
  const [date, setDate] = useState<Date>(sDate)

  useEffect(() => {
    if (!jwt) {
      return
    }

    const args = {
      size: 500,
      where: {
        startDate: date.toISOString().replace(/T.*$/, 'T00:00:00Z')
      }
    }

    Planning.search(indexUrl, jwt, args)
      .then(result => {
        setResult(result)
      })
      .catch(ex => {
        console.log(ex)
      })
  }, [indexUrl, jwt, date])

  return (
    <Tabs defaultValue='list' className='flex-1'>
      <ViewHeader
        { ...props}
      >
        <PlanningHeader date={date} setDate={setDate} />
      </ViewHeader>
      <main className='h-full flex-1 flex-col space-y-8 p-8 md:flex'>
        {result?.ok === true &&
          <>
            <TabsContent value='list'>
              <PlanningTable data={result?.hits} columns={columns} />
            </TabsContent>
            <TabsContent value='grid'>
              Grid
            </TabsContent>
          </>
        }
      </main>
    </Tabs>
  )
}

PlanningOverview.displayName = 'PlanningOverview'
