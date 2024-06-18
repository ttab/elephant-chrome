import { useEffect, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader } from '@/components'
import { CalendarPlus2 } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'

import { CalendarTableProvider } from '@/contexts/CalendarTableProvider'
import { TableCommandMenu } from '@/views/Overviews/CalendarOverview/CalendarTable/TableCommandMenu'
import { CalendarList } from './CalendarList'
import { CalendarGrid } from './CalendarGrid'
import { CalendarHeader } from './CalendarHeader'

const meta: ViewMetadata = {
  name: 'Events',
  path: `${import.meta.env.BASE_URL}/events`,
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

export const Events = (): JSX.Element => {
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(getEndDate(startDate))
  const [currentTab, setCurrentTab] = useState<string>('list')

  useEffect(() => {
    setEndDate(getEndDate(startDate))
  }, [startDate])

  return (
    <CalendarTableProvider>
      <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

        <TableCommandMenu />

        <div className="flex flex-col h-screen">
          <ViewHeader.Root>
            <ViewHeader.Title title="Händelser" short="Händelser" icon={CalendarPlus2} iconColor='#5E9F5D' />

            <ViewHeader.Content>
              <CalendarHeader
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
              <CalendarList date={startDate} />
            </TabsContent>

            <TabsContent value='grid'>
              <CalendarGrid startDate={startDate} endDate={endDate} />
            </TabsContent>
          </ScrollArea>
        </div>

      </Tabs>
    </CalendarTableProvider>
  )
}

Events.meta = meta

function getEndDate(startDate: Date): Date {
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 6)
  return endDate
}
