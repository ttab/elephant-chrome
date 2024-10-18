import { useMemo, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { ViewHeader } from '@/components'
import { CalendarPlus2 } from '@ttab/elephant-ui/icons'
import { ScrollArea, Tabs, TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { EventsList } from './EventsList'
import { Header } from '@/components/Header'
import { Commands } from '@/components/Commands'
import { eventTableColumns } from './EventsListColumns'
import { type Event } from '@/lib/index'
import { Events as EventsIndex } from '@/lib/events'
import { useSections } from '@/hooks/useSections'
import { SWRProvider } from '@/contexts/SWRProvider'
import { getDateTimeBoundariesUTC } from '@/lib/datetime'

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
  const [currentTab, setCurrentTab] = useState<string>('list')
  const sections = useSections()

  const columns = useMemo(() => eventTableColumns({ sections }), [sections])
  const { from, to } = useMemo(() => getDateTimeBoundariesUTC(startDate), [startDate])

  return (
    <TableProvider<Event> columns={columns}>
      <SWRProvider<Event> index={EventsIndex}>
        <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

          <TableCommandMenu heading='Events'>
            <Commands />
          </TableCommandMenu>

          <div className="flex flex-col h-screen">
            <ViewHeader.Root>
              <ViewHeader.Title title="Händelser" short="Händelser" icon={CalendarPlus2} iconColor='#5E9F5D' />

              <ViewHeader.Content>
                <Header tab={currentTab} type='Events' />
              </ViewHeader.Content>

              <ViewHeader.Action />
            </ViewHeader.Root>

            <ScrollArea>
              <TabsContent value='list' className='mt-0'>
                <EventsList from={from} to={to} />
              </TabsContent>

              <TabsContent value='grid'>
              </TabsContent>
            </ScrollArea>
          </div>

        </Tabs>
      </SWRProvider>
    </TableProvider>
  )
}

Events.meta = meta
