
import { Title } from '@/components/Table/Items/Title'
import { type ColumnDef } from '@tanstack/react-table'
import { CircleCheck, Pen } from '@ttab/elephant-ui/icons'
import type { PrintArticle } from '@/hooks/baboon/lib/printArticles'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
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
      enableGrouping: false,
      enableColumnFilter: true,
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
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
        const status = row.original.fields['workflow_state']?.values[0] || 'draft'
        return <DocumentStatus type='tt/print-article' status={status} />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    {
      id: 'printFlow',
      enableGrouping: true,
      enableSorting: true,
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        // options: PrintFlows,
        name: 'Flöde',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => (data.fields['document.rel.flow.title'].values[0]),
      cell: ({ row }) => {
        const flow = row.getValue('printFlow')
        return <span>{flow as string}</span>
      }
    },
    {
      id: 'articleTitle',
      enableGrouping: false,
      meta: {
        name: 'Artikel',
        columnIcon: Pen,
        className: 'flex-1 w-8'
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
    },
    {
      id: 'document.title',
      enableGrouping: false,
      meta: {
        name: 'Titel',
        columnIcon: Pen,
        className: 'flex-1'
      },
      accessorFn: (data) => (data.fields['document.title'].values[0]),
      cell: ({ row }) => {
        const title = row.getValue('document.title')
        return <span>{title as string}</span>
      }
    },
    {
      id: 'headline',
      enableGrouping: false,
      meta: {
        name: 'Rubrik',
        columnIcon: Pen,
        className: 'flex-1'
      },
      accessorFn: (data) => {
        const _texts = data.fields['document.content.core_text.data.text'].values
        const _roles = data.fields['document.content.core_text.role'].values
        let _title = ''
        _roles.forEach((role, index) => {
          if (role === 'heading-1') {
            _title = _texts[index]
          }
        })
        return _title || ''
      },
      cell: ({ row }) => {
        const title = row.getValue('headline')
        return <span>{title as string}</span>
      }
    }
  ]
}
