import type { JSX } from 'react'
import { useQuery } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { Article, ArticleFields } from '@/shared/schemas/article'
import { Toolbar } from './Toolbar'
import { useDocuments } from '@/hooks/index/useDocuments'
import { timelessParams } from '@/hooks/index/useDocuments/queries/views/timeless'

export const TimelessResult = ({ columns }: {
  columns: ColumnDef<Article, unknown>[]
}): JSX.Element => {
  const [filter] = useQuery()

  useDocuments<Article, ArticleFields>({
    ...timelessParams(filter),
    page: typeof filter.page === 'string' ? parseInt(filter.page) : undefined,
    options: {
      subscribe: true,
      setTableData: true
    }
  })

  return (
    <>
      <Toolbar />
      <Table
        type='Timeless'
        searchType='Editor'
        columns={columns as ColumnDef<Article>[]}
      />
    </>
  )
}
