import { useCallback } from 'react'
import { useQuery } from '@/hooks'

import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { Factbox } from '@/hooks/index/lib/factboxes'
import { useFactboxes } from '@/hooks/index/useFactboxes'
import { Toolbar } from './Toolbar'

export const FactboxList = ({ columns }: {
  columns: ColumnDef<Factbox, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['query'])

  useFactboxes({
    filter: filter,
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined
  })

  const onRowSelected = useCallback((row?: Factbox) => {
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
        type='Factbox'
        columns={columns}
        onRowSelected={onRowSelected}
      />
    </>
  )
}
