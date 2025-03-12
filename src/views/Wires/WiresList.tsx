import { useCallback } from 'react'
import { useQuery } from '@/hooks'

import { Table } from '@/components/Table'
import { useWires } from '@/hooks/index/useWires'
import type { Wire } from '@/hooks/index/lib/wires'
import type { ColumnDef } from '@tanstack/react-table'
import { Toolbar } from './Toolbar'

export const WireList = ({ columns }: {
  columns: ColumnDef<Wire, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['section', 'source', 'query', 'newsvalue'])

  useWires({
    filter: filter,
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined
  })

  const onRowSelected = useCallback((row?: Wire) => {
    if (row) {
      console.info(`Selected planning item ${row.id}`)
    } else {
      console.info('Deselected row')
    }
    return row
  }, [])

  return (
    <>
      <Toolbar />
      <Table
        type='Wires'
        columns={columns}
        onRowSelected={onRowSelected}
      />
    </>
  )
}
