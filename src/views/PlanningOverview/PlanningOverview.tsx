import { type ViewMetadata, type ViewProps } from '@/types'
import { ViewHeader } from '@/components'
import { useSession } from '@/hooks'
import { useApi } from '@/hooks/useApi'
import { type SearchIndexResponse } from '@/lib/index/search'
import { Planning } from '@/lib/planning'
import { useEffect, useState } from 'react'
import { type Planning as PlanningType } from '@/components/PlanningTable/data/schema'
import { CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { PlanningTable } from '@/components/PlanningTable'
import { columns } from '@/components/PlanningTable/Columns'
import { PlanningHeader } from './PlanningHeader'

import {
  Tabs,
  TabsContent
} from '@ttab/elephant-ui'

import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'
import { PlanningGridColumn } from './PlanningGridColumn'
import { View } from '@/components/View/View'

type PlanningsByDate = Record<string, PlanningType[]>

const meta: ViewMetadata = {
  name: 'PlanningOverview',
  path: '/',
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 4
  }
}

export const PlanningOverview = (props: ViewProps): JSX.Element => {
  const { jwt } = useSession()
  const { indexUrl } = useApi()
  const [result, setResult] = useState<SearchIndexResponse | undefined>()
  const [plannings, setPlannings] = useState<PlanningsByDate | undefined>()
  // const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(getEndDate(startDate))
  const [currentTab, setCurrentTab] = useState<string>('list')

  useEffect(() => {
    if (!jwt) {
      return
    }

    const args = {
      size: 100,
      where: {
        start: startDate.toISOString().replace(/T.*$/, 'T00:00:00Z'),
        end: endDate.toISOString().replace(/T.*$/, 'T00:00:00Z')
      }
    }

    Planning.search(indexUrl, jwt, args)
      .then(result => {
        setResult(result)
        setPlannings(structureByDate(result))
      })
      .catch(ex => {
        console.log(ex)
      })
  }, [indexUrl, jwt, startDate, endDate])

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

  const colSpan = (Object.keys(plannings || {}).length || 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7


  return (
    <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

      <ViewHeader {...props} title="Planeringsöversikt" icon={CalendarDaysIcon}>
        <PlanningHeader
          tab={currentTab}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      </ViewHeader>

      <View>
        <main className='h-full flex-1 flex-col space-y-8 md:flex'>
          {result?.ok === true &&
            <>
              <TabsContent value='list'>
                <PlanningTable data={result?.hits} columns={columns} />
              </TabsContent>

              <TabsContent value='grid' className="">
                <div className={cn(grid({ size: colSpan }))}>
                  {plannings !== undefined && <>
                    {Object.keys(plannings).sort((dt1, dt2) => { return dt1 > dt2 ? 1 : -1 }).map((key) => (
                      <PlanningGridColumn key={key} date={new Date(key)} items={plannings[key]} />
                    ))}
                  </>}

                </div>
              </TabsContent>
            </>
          }
        </main>
      </View>
    </Tabs>
  )
}

PlanningOverview.meta = meta

function getEndDate(startDate: Date): Date {
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 6)
  return endDate
}

function structureByDate(result: SearchIndexResponse): PlanningsByDate | undefined {
  const plannings: PlanningsByDate = {}

  if (!Array.isArray(result?.hits)) {
    return
  }

  let length = 0
  for (const item of result.hits) {
    const date = item._source['document.meta.core_assignment.data.start_date'][0].substring(0, 10)

    if (!Array.isArray(plannings[date])) {
      if (++length >= 7) {
        break
      }
      plannings[date] = []
    }

    plannings[date].push(item)
  }

  return plannings
}
