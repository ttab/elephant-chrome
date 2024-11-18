import { useCallback, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { useSections, useTable } from '@/hooks'
import {
  type Planning
} from '@/lib/index'

import { Table } from '@/components/Table'
import { planningListColumns } from '@/views/PlanningOverview/PlanningListColumns'

export const PlanningList = ({ from, to }: {
  from: string
  to: string
}): JSX.Element => {
  const sections = useSections()

  const { error } = useSWR<Planning[], Error>(['Plannings', {
    where: {
      start: from,
      end: to
    }
  }, { withStatus: true }])
  const columns = useMemo(() => planningListColumns({ sections }), [sections])

  const { table } = useTable()

  useEffect(() => {
    table.setGrouping(['newsvalue'])
  }, [table])

  const onRowSelected = useCallback((row?: Planning) => {
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
      type='Planning'
      columns={columns}
      onRowSelected={onRowSelected}
    />
  )
}
