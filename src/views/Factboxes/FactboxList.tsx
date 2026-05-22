import { type JSX } from 'react'
import { useQuery } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { Factbox, FactboxFields } from '@/shared/schemas/factbox'
import { Toolbar } from './Toolbar'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/index/useDocuments/queries/views/factboxes'
import { fields } from '@/shared/schemas/factbox'
import { Pagination } from '@/components/Table/Pagination'

export const FactboxList = ({ columns }: {
  columns: ColumnDef<Factbox, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['query'])
  const [{ documentOrigin }] = useQuery(['documentOrigin'])
  const currentPage = typeof page === 'string' ? parseInt(page) : 1

  // Drive the fetch from the QuickFilter radio (synced to URL via TableProvider).
  // Default (no value) shows both sources; selecting one skips the other fetch
  // entirely instead of relying on a client-side row filter.
  const origin = Array.isArray(documentOrigin) ? documentOrigin[0] : documentOrigin
  const withArticleFactboxes: boolean | 'only'
    = origin === 'core/factbox'
      ? false
      : origin === 'core/article'
        ? 'only'
        : true

  useDocuments<Factbox, FactboxFields>({
    documentType: 'core/factbox',
    fields,
    query: constructQuery(filter),
    sort: [{ field: 'modified', desc: true }],
    size: 50,
    page: currentPage,
    options: {
      subscribe: true,
      setTableData: true,
      withArticleFactboxes
    }
  })

  return (
    <>
      <Toolbar />
      <Table
        type='Factbox'
        columns={columns}
      />
      <Pagination />
    </>
  )
}
