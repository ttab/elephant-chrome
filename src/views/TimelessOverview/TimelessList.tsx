import { useEffect, useMemo, type JSX } from 'react'
import { useQuery, type QueryParams } from '@/hooks/useQuery'
import { Table } from '@/components/Table'
import { Pagination } from '@/components/Table/Pagination'
import type { ColumnDef } from '@tanstack/react-table'
import type { TimelessArticle, TimelessArticleFields } from '@/shared/schemas/timelessArticle'
import { useDocuments } from '@/hooks/index/useDocuments'
import { useTable } from '@/hooks/useTable'
import { useUserTracker } from '@/hooks/useUserTracker'
import { timelessParams } from '@/hooks/index/useDocuments/queries/views/timeless'
import { columnFilterToQuery } from '@/lib/loadFilters'

export const TimelessList = ({ columns }: {
  columns: ColumnDef<TimelessArticle, unknown>[]
}): JSX.Element => {
  const [filter] = useQuery()
  const { table } = useTable<TimelessArticle>()
  const [, setSavedFilters] = useUserTracker<QueryParams | undefined>('filters.Timeless.current')
  const columnFilters = table.getState().columnFilters

  useEffect(() => {
    setSavedFilters(columnFilterToQuery(columnFilters))
  }, [columnFilters, setSavedFilters])

  const status = useMemo(() => {
    const found = columnFilters.find((f) => f.id === 'status')
    return Array.isArray(found?.value) ? (found.value as string[]) : undefined
  }, [columnFilters])

  useDocuments<TimelessArticle, TimelessArticleFields>({
    ...timelessParams(status),
    page: typeof filter.page === 'string' ? parseInt(filter.page) : undefined,
    options: {
      subscribe: true,
      setTableData: true
    }
  })

  return (
    <>
      <Table
        type='Timeless'
        searchType='Editor'
        columns={columns as ColumnDef<TimelessArticle>[]}
      />
      <Pagination />
    </>
  )
}
