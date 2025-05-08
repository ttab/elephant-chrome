import { useCallback } from 'react'
import { useQuery } from '@/hooks'

import { Table } from '@/components/Table'
import type { WireFields } from '@/hooks/index/useDocuments/schemas/wire'
import { fields, type Wire } from '@/hooks/index/useDocuments/schemas/wire'
import type { ColumnDef } from '@tanstack/react-table'
import { Toolbar } from './Toolbar'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/wires'
import { SortingV1 } from '@ttab/elephant-api/index'

export const WireList = ({ columns }: {
  columns: ColumnDef<Wire, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['section', 'source', 'query', 'newsvalue'])

  useDocuments<Wire, WireFields>({
    documentType: 'tt/wire',
    size: 40,
    query: constructQuery(filter),
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined,
    fields,
    sort: [
      SortingV1.create({ field: 'modified', desc: true })
    ],
    options: {
      setTableData: true,
      subscribe: true
    }
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
