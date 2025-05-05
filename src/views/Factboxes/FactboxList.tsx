import { useCallback } from 'react'
import { useQuery } from '@/hooks'

import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { Factbox } from '@/hooks/index/useDocuments/schemas/factbox'
import { Toolbar } from './Toolbar'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/factboxes'
import { fields } from '@/hooks/index/useDocuments/schemas/factbox'


export const FactboxList = ({ columns }: {
  columns: ColumnDef<Factbox, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['query'])

  useDocuments({
    documentType: 'core/factbox',
    fields,
    query: constructQuery(filter),
    sort: [{ field: 'modified', desc: true }],
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined,
    options: {
      setTableData: true
    }
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
