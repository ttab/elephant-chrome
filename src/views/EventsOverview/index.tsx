import { useMemo, useState } from 'react'
import { type ViewMetadata } from '@/types'
import { View, ViewHeader } from '@/components'
import { TabsContent } from '@ttab/elephant-ui'
import { TableProvider } from '@/contexts/TableProvider'
import { TableCommandMenu } from '@/components/Commands/TableCommand'
import { EventsList } from './EventsList'
import { Header } from '@/components/Header'
import { Commands } from '@/components/Commands'
import { eventTableColumns } from './EventsListColumns'
import { type Event } from '@/shared/schemas/event'
import { useSections } from '@/hooks/useSections'
import { useQuery } from '@/hooks/useQuery'
import { useOrganisers } from '@/hooks/useOrganisers'
import { useRegistry } from '@/hooks/useRegistry'
import { useInitFilters } from '@/hooks/useFilters'

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

  const organisers = useOrganisers()
  const { locale } = useRegistry()
  const columns = useMemo(() =>
    eventTableColumns({ sections, organisers, locale }), [sections, organisers, locale])

  const columnFilters = useInitFilters<Event>({ type: 'Events', columns })

  return (
    <View.Root tab={currentTab} onTabChange={setCurrentTab}>
      <TableProvider<Event>
        type={meta.name}
        columns={columns}
        initialState={{
          grouping: ['newsvalue'],
          columnFilters,
          globalFilter: query.query
        }}
      >
        <TableCommandMenu heading='Events'>
          <Commands />
        </TableCommandMenu>

        <ViewHeader.Root>
          <ViewHeader.Content>
            <ViewHeader.Title name='Events' title='Händelser' short='Händelser' />
            <Header type='Event' />
          </ViewHeader.Content>

          <ViewHeader.Action />
        </ViewHeader.Root>

        <View.Content>
          <TabsContent value='list' className='mt-0'>
            <EventsList />
          </TabsContent>

          <TabsContent value='grid'>
          </TabsContent>
        </View.Content>
      </TableProvider>
    </View.Root>
  )
}

Events.meta = meta
