import { useCallback, type JSX } from 'react'
import { useQuery } from '@/hooks'
import { Table } from '@/components/Table'
import type { ColumnDef } from '@tanstack/react-table'
import type { TimelessArticle, TimelessArticleFields } from '@/shared/schemas/timelessArticle'
import { Toolbar } from './Toolbar'
import { useDocuments } from '@/hooks/index/useDocuments'
import { timelessParams } from '@/hooks/index/useDocuments/queries/views/timeless'

export const TimelessResult = ({ columns }: {
  columns: ColumnDef<TimelessArticle, unknown>[]
}): JSX.Element => {
  const [filter] = useQuery()

  useDocuments<TimelessArticle, TimelessArticleFields>({
    ...timelessParams(filter),
    page: typeof filter.page === 'string' ? parseInt(filter.page) : undefined,
    options: {
      subscribe: true,
      setTableData: true
    }
  })

  const onRowSelected = useCallback((row?: TimelessArticle) => {
    if (row) {
      console.info(`Selected timeless article ${row.id}`)
    }
    return row
  }, [])

  return (
    <>
      <Toolbar />
      <Table
        type='Timeless'
        searchType='Editor'
        columns={columns as ColumnDef<TimelessArticle>[]}
        onRowSelected={onRowSelected}
      />
    </>
  )
}
