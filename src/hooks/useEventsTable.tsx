import { useContext } from 'react'
import { EventsTableContext } from '@/contexts'
import { type TableProviderState } from '@/contexts/EventsTableProvider'
import { type Events } from '@/views/Overviews/EventsOverview/EventsTable/data/schema'

export const useEventsTable = (): TableProviderState<Events> => {
  const context = useContext(EventsTableContext)

  if (context === undefined) { throw new Error('useTable must be used within a TableProvider') }

  return context
}
