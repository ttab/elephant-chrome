import { useCallback } from 'react'
import useSWR from 'swr'
import {
  type Planning
} from '@/lib/index'

import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'

export const PlanningList = ({ from, to, columns }: {
  from: string
  to: string
  columns: ColumnDef<Planning>[]
}): JSX.Element => {
  const { error } = useSWR<Planning[], Error>(['Plannings', {
    where: {
      start: from,
      end: to
    }
  }, { withStatus: true }])

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
