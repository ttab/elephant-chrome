import { useCallback, useMemo } from 'react'
import { useOrganisers, useQuery, useRegistry, useSections } from '@/hooks'
import type { EventFields } from '@/hooks/index/useDocuments/schemas/event'
import { type Event, fields } from '@/hooks/index/useDocuments/schemas/event'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/events'
import { eventTableColumns } from '@/views/EventsOverview/EventsListColumns'

import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import { SortingV1 } from '@ttab/elephant-api/index'
import { toast } from 'sonner'
import { getUTCDateRange } from '@/lib/datetime'

export const EventsList = (): JSX.Element => {
  const sections = useSections()
  const organisers = useOrganisers()
  const { locale, timeZone } = useRegistry()

  const [query] = useQuery()
  const [from, to] = useMemo(() => {
    // new Date(`${query.from}T00:00:00.000Z`)
    const zoned = getUTCDateRange(query?.from ? new Date(query?.from as string) : new Date(), timeZone)
    const fromZoned = zoned.from
    const toZoned = zoned.to
    return [fromZoned, toZoned]
  }, [query, timeZone])

  const { error } = useDocuments<Event, EventFields>({
    documentType: 'core/event',
    query: constructQuery({ from, to }),
    fields,
    sort: [
      SortingV1.create({ field: 'document.meta.core_newsvalue.value', desc: true }),
      SortingV1.create({ field: 'document.meta.core_event.data.start', desc: false })
    ],
    options: {
      aggregatePages: true,
      setTableData: true,
      withStatus: true,
      withPlannings: true,
      subscribe: true
    }

  })

  const columns = useMemo(() => eventTableColumns({ sections, organisers, locale }), [sections, organisers, locale])

  const onRowSelected = useCallback((row?: Event) => {
    if (row) {
      console.info(`Selected planning item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  if (error) {
    console.error('Error fetching event items:', error)
    toast.error('Kunde inte hämta händelser')
  }

  return (
    <Table
      type='Event'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
