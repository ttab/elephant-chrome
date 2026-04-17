import { useCallback, useEffect, type JSX } from 'react'
import { useQuery } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { Factbox, FactboxFields } from '@/shared/schemas/factbox'
import { Toolbar } from './Toolbar'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/factboxes'
import { fields } from '@/shared/schemas/factbox'
import { Pagination } from '@/components/Table/Pagination'
import { useTable } from '@/hooks/useTable'

const PAGE_SIZE = 100

export const FactboxList = ({ columns }: {
  columns: ColumnDef<Factbox, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['query'])
  const { setData } = useTable<Factbox>()
  const currentPage = typeof page === 'string' ? parseInt(page) : 1

  const { data } = useDocuments<Factbox, FactboxFields>({
    documentType: 'core/factbox',
    fields,
    query: constructQuery(filter),
    sort: [{ field: 'modified', desc: true }],
    size: 1000,
    options: {
      subscribe: true,
      withArticleFactboxes: true
    }
  })

  useEffect(() => {
    if (!data) return
    // TO FIX: added pagination on the client side as a temporary solution. Needs to be reworked to show more correct data.
    const start = (currentPage - 1) * PAGE_SIZE
    setData(data.slice(start, start + PAGE_SIZE))
  }, [data, currentPage, setData])

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
      <Pagination total={data?.length} />
    </>
  )
}
