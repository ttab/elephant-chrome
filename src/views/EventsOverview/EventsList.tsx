import { useCallback, useMemo } from 'react'
import { useOrganisers, useQuery, useRegistry, useSections } from '@/hooks'
import { type Event, fields } from '@/hooks/index/useDocuments/schemas/event'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/events'
import { eventTableColumns } from '@/views/EventsOverview/EventsListColumns'

import { Table } from '@/components/Table'
import { useDocuments } from '@/hooks/index/useDocuments'
import { SortingV1 } from '@ttab/elephant-api/index'
import { getDateTimeBoundaries } from '@/lib/datetime'
import { parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const EventsList = (): JSX.Element => {
  const sections = useSections()
  const organisers = useOrganisers()
  const { locale } = useRegistry()

  const [query] = useQuery(['from', 'to'])
  const { startTime: from, endTime: to } = useMemo(() => {
    const date = typeof query.from === 'string' ? parseISO(query.from) : Date.now()
    const utcDate = toZonedTime(date, 'Europe/Stockholm')
    return getDateTimeBoundaries(utcDate)
  }, [query.from])

  useDocuments({
    documentType: 'core/event',
    size: 100, // TODO: use pagination
    query: constructQuery({ from: from.toISOString(), to: to.toISOString() }),
    fields,
    sort: [
      SortingV1.create({ field: 'document.meta.core_newsvalue.value', desc: true }),
      SortingV1.create({ field: 'document.meta.core_event.data.start', desc: false })
    ],
    options: {
      withStatus: true,
      withPlannings: true,
      allPages: true
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


  /* if (error) {
    return <pre>{error.message}</pre>
  } */

  return (
    <Table
      type='Event'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
