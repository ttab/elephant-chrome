import { useCallback, useMemo } from 'react'
import useSWR from 'swr'

import { useSections } from '@/hooks'
import { type Event } from '@/lib/index/schemas'
import { eventTableColumns } from '@/views/EventsOverview/EventsListColumns'

import { Table } from '@/components/Table'

export const EventsList = ({ from, to }: {
  from: string
  to: string
}): JSX.Element => {
  const sections = useSections()

  const { error } = useSWR<Event[], Error>(['Events', {
    where: {
      start: from,
      end: to
    }
  }, { withPlannings: true, withStatus: true }])

  const columns = useMemo(() => eventTableColumns({ sections }), [sections])

  const onRowSelected = useCallback((row?: Event) => {
    if (row) {
      console.info(`Selected planning item ${row._id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])


  if (error) {
    return <pre>{error.message}</pre>
  }

  return (
    <Table
      type='Event'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
