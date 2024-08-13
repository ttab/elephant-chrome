import { useEffect, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader } from '@/components'
import { CalendarPlus2 } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { EventsList } from './EventsList'
import { EventsGrid } from './EventsGrid'
import { Header } from './EventsHeader'
import { EventsCommands } from './EventsCommands'
import { eventColumns } from './EventsListColumns'
import { type Event } from '@/lib/index'

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
    <TableProvider<Event> columns={eventColumns}>
      <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

        <TableCommandMenu>
          <EventsCommands />
        </TableCommandMenu>

        <div className="flex flex-col h-screen">
          <ViewHeader.Root>
            <ViewHeader.Title title="Händelser" short="Händelser" icon={CalendarPlus2} iconColor='#5E9F5D' />

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
              <EventsList date={startDate} />
            </TabsContent>

            <TabsContent value='grid'>
              <EventsGrid startDate={startDate} endDate={endDate} />
            </TabsContent>
          </ScrollArea>
        </div>

      </Tabs>
    </TableProvider>
  )
}

Events.meta = meta

function getEndDate(startDate: Date): Date {
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 6)
  return endDate
}
