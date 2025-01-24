import { useMemo, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { View, ViewHeader } from '@/components'
import { CalendarPlus2 } from '@ttab/elephant-ui/icons'
import { Tabs, TabsContent } from '@ttab/elephant-ui'
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
import { useQuery } from '@/hooks/useQuery'
import { type EventSearchParams } from '@/lib/events/search'

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
  const [currentTab, setCurrentTab] = useState<string>('list')
  const sections = useSections()
  const [query] = useQuery()
  const { from, to } = useMemo(() =>
    getDateTimeBoundariesUTC(typeof query.from === 'string'
      ? new Date(`${query.from}T00:00:00.000Z`)
      : new Date()),
  [query.from])

  const columns = useMemo(() => eventTableColumns({ sections }), [sections])

  return (
    <View.Root>
      <TableProvider<Event> columns={columns}>
        <SWRProvider<Event, EventSearchParams> index={EventsIndex}>
          <Tabs defaultValue={currentTab} className='flex-1' onValueChange={setCurrentTab}>

            <TableCommandMenu heading='Events'>
              <Commands />
            </TableCommandMenu>

            <div className='flex flex-col h-screen'>
              <ViewHeader.Root>
                <ViewHeader.Title title='Händelser' short='Händelser' icon={CalendarPlus2} iconColor='#D802FD' />

                <ViewHeader.Content>
                  <Header type='Event' />
                </ViewHeader.Content>

                <ViewHeader.Action />
              </ViewHeader.Root>

              <View.Content>
                <TabsContent value='list' className='mt-0'>
                  <EventsList from={from} to={to} />
                </TabsContent>

                <TabsContent value='grid'>
                </TabsContent>
              </View.Content>
            </div>

          </Tabs>
        </SWRProvider>
      </TableProvider>
    </View.Root>
  )
}

Events.meta = meta
