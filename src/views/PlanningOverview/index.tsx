import { useEffect, useState } from 'react'
import { type ViewMetadata, type ViewProps } from '@/types'
import { ViewHeader } from '@/components'
import { CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { PlanningHeader } from './PlanningHeader'
import { ScrollArea, ScrollBar, Tabs, TabsContent } from '@ttab/elephant-ui'

import { PlanningGrid } from './PlanningGrid'
import { PlanningList } from './PlanningList'

const meta: ViewMetadata = {
  name: 'PlanningOverview',
  path: import.meta.env.BASE_URL || '/',
  widths: {
    sm: 12,
    md: 12,
    lg: 12,
    xl: 8,
    '2xl': 6
  }
}

export const PlanningOverview = (props: ViewProps): JSX.Element => {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(getEndDate(startDate))
  const [currentTab, setCurrentTab] = useState<string>('list')

  useEffect(() => {
    setEndDate(getEndDate(startDate))
  }, [startDate])

  return (
    <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

      <div className="flex flex-col h-screen">
        <div className="grow-0">
          <ViewHeader {...props} title="Planeringsöversikt" shortTitle="Planering" icon={CalendarDaysIcon}>
            <PlanningHeader
              tab={currentTab}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          </ViewHeader>
        </div>

        <ScrollArea>
          <ScrollArea>
            <main>
              <TabsContent value='list'>
                <PlanningList date={startDate} />
              </TabsContent>

              <TabsContent value='grid'>
                <PlanningGrid startDate={startDate} endDate={endDate} />
              </TabsContent>
            </main>
          </ScrollArea>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

      </div>
    </Tabs>
  )
}

PlanningOverview.meta = meta

function getEndDate(startDate: Date): Date {
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 6)
  return endDate
}
