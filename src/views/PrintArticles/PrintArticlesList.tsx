import { useCallback } from 'react'
import { useQuery } from '@/hooks'
import { Toolbar } from './PrintArticlesToolbar'
import { Table } from '@/components/Table'
import type { PrintArticle } from '@/hooks/baboon/lib/printArticles'
import type { ColumnDef } from '@tanstack/react-table'
import { useDocuments } from '@/hooks/index/useDocuments'
import { constructQuery } from '@/hooks/baboon/useDocuments/printArticle'
import { fields, type PrintArticleFields } from '@/hooks/baboon/lib/printArticles/schema'
import { SortingV1 } from '@ttab/elephant-api/index'

/**
 * PrintArticleList component.
 *
 * This component renders a list of print articles using a table. It utilizes the
 * `usePrintArticles` hook to fetch and manage the state of print articles based on
 * the provided filter query. The component also includes a toolbar for additional
 * actions and a callback function to handle row selection in the table.
 *
 * @param props - The component props.
 * @param props.columns - The column definitions for the table.
 * @returns The rendered PrintArticleList component.
 *
 * @remarks
 * The component uses the `useQuery` hook to extract filter parameters from the query string.
 * It also defines a `onRowSelected` callback to log the selected or deselected row information.
 */

export const PrintArticleList = ({ columns }: {
  columns: ColumnDef<PrintArticle, unknown>[]
}): JSX.Element => {
  const [filter] = useQuery(['from', 'printFlow', 'workflowState'])

  useDocuments<PrintArticle, PrintArticleFields>({
    documentType: 'tt/print-article',
    query: constructQuery(filter),
    size: 1000,
    fields,
    sort: [
      SortingV1.create({ field: 'document.rel.flow.title.sort', desc: false }),
      SortingV1.create({ field: 'document.title.sort', desc: false })
    ],
    options: {
      setTableData: true,
      subscribe: true
    }
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
