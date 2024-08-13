import { useEffect, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader } from '@/components'
import { CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'

import { PlanningGrid } from './PlanningGrid'
import { PlanningList } from './PlanningList'
import { TableProvider } from '@/contexts/TableProvider'

import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { Header } from '@/views/PlanningOverview/PlanningHeader'
import { PlanningCommands } from './PlanningCommands'
import { planningColumns } from './PlanningListColumns'
import { type Planning } from '@/lib/index'

const meta: ViewMetadata = {
  name: 'Plannings',
  path: `${import.meta.env.BASE_URL}/plannings`,
  widths: {
    sm: 12,
    md: 12,
    lg: 6,
    xl: 6,
    '2xl': 6,
    hd: 6,
    fhd: 4,
    qhd: 3,
    uhd: 2
  }
}

export const Plannings = (): JSX.Element => {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(getEndDate(startDate))
  const [currentTab, setCurrentTab] = useState<string>('list')

  useEffect(() => {
    setEndDate(getEndDate(startDate))
  }, [startDate])

  return (
    <TableProvider<Planning> columns={planningColumns}>
      <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

        <TableCommandMenu>
          <PlanningCommands />
        </TableCommandMenu>

        <div className="flex flex-col h-screen">
          <ViewHeader.Root>
            <ViewHeader.Title title="Planeringar" short="Planeringar" icon={CalendarDaysIcon} iconColor='#FF971E' />

            <ViewHeader.Content>
              <Header
                tab={currentTab}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
              />
            </ViewHeader.Content>

            <ViewHeader.Action />
          </ViewHeader.Root>

          <ScrollArea>
            <TabsContent value='list' className='mt-0'>
              <PlanningList date={startDate} />
            </TabsContent>

            <TabsContent value='grid'>
              <PlanningGrid startDate={startDate} endDate={endDate} />
            </TabsContent>
          </ScrollArea>
        </div>

      </Tabs>
    </TableProvider>
  )
}

Plannings.meta = meta

function getEndDate(startDate: Date): Date {
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 6)
  return endDate
}
