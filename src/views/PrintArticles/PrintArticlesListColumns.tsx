
import { Title } from '@/components/Table/Items/Title'
import { type ColumnDef } from '@tanstack/react-table'
import { CircleCheck, Pen } from '@ttab/elephant-ui/icons'
import type { PrintArticle } from '@/hooks/baboon/lib/printArticles'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'

/**
 * Generates column definitions for the Print Articles list.
 *
 * This function returns an array of column definitions used to render the
 * Print Articles table. Each column definition includes metadata such as
 * the column name, icon, and display logic.
 *
 * @returns An array of column definitions for the Print Articles table.
 */

export function printArticlesListColumns(): Array<ColumnDef<PrintArticle>> {
  return [
    {
      id: 'workflowState',
      meta: {
        options: DocumentStatuses,
        name: 'Status',
        columnIcon: CircleCheck,
        className: 'flex-none w-16',
        display: (value: string) => (
          <span>
            {DocumentStatuses
              .find((status) => status.value === value)?.label || 'draft'}
          </span>
        )
      },
      accessorFn: (data) => (data.fields['workflow_state'].values[0]),
      cell: ({ row }) => {
        const status = row.original.fields['workflow_state']?.values[0] || 'draft' // row?.getValue('workflowState')
        return <DocumentStatus type='tt/print-article' status={status as string} />
      }
    },
    {
      id: 'printFlow',
      meta: {
        name: 'Flöde',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => (data.fields['document.rel.flow.title'].values[0]),
      cell: ({ row }) => {
        const flow = row.getValue('printFlow')
        return <span>{flow}</span>
      }
    },
    {
      id: 'articleTitle',
      meta: {
        name: 'Artikel',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => (data.fields['document.meta.tt_print_article.title'].values[0]),
      cell: ({ row }) => {
        const title = row.getValue('articleTitle')
        return (
          <Title
            title={title as string}
            className='text-sm'
          />
        )
      }
    }
  ]
}
