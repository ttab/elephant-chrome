import { useCallback } from 'react'
import { useQuery } from '@/hooks'
import { usePrintArticles } from '@/hooks/index/usePrintArticles'
import { Toolbar } from './Toolbar'
import { Table } from '@/components/Table'
import type { PrintArticle } from '@/hooks/index/lib/printArticles'
import type { ColumnDef } from '@tanstack/react-table'

export const PrintArticleList = ({ columns }: {
  columns: ColumnDef<PrintArticle, unknown>[]
}): JSX.Element => {
  const [{ page }] = useQuery()
  const [filter] = useQuery(['section', 'source', 'query', 'newsvalue'])

  usePrintArticles({
    filter: filter,
    page: typeof page === 'string'
      ? parseInt(page)
      : undefined
  })

  const onRowSelected = useCallback((row?: PrintArticle) => {
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
        type='PrintEditor'
        columns={columns}
        onRowSelected={onRowSelected}
      />
    </>
  )
}
