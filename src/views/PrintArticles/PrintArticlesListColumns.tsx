
import { Title } from '@/components/Table/Items/Title'
import { type ColumnDef } from '@tanstack/react-table'
import { Pen } from '@ttab/elephant-ui/icons'
import type { PrintArticle } from '@/hooks/baboon/lib/printArticles'


/**
 * Generates column definitions for the Print Articles list.
 *
 * This function returns an array of column definitions used to render the
 * Print Articles table. Each column definition includes metadata such as
 * the column name, icon, and display logic.
 *
 * @param options - Options for generating the column definitions.
 * @param options.locale - The locale used for formatting dates.
 * @returns An array of column definitions for the Print Articles table.
 */
export function printArticlesListColumns({ locale = 'sv-SE' }: {
  locale?: string
}): Array<ColumnDef<PrintArticle>> {
  return [
    {
      id: 'modified',
      enableGrouping: false,
      accessorFn: (data) => {
        const date = new Date(data.fields.modified.values[0])

        if (date.toDateString() === new Date().toDateString()) {
          return date.getHours()
        } else {
          return `${date.getHours()} ${date.toLocaleString(locale, { weekday: 'long', hourCycle: 'h23' })}`
        }
      },
      cell: () => {
        return undefined
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
    },
    {
      id: 'title',
      meta: {
        name: 'Slugg',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => (data.fields['document.title'].values[0]),
      cell: ({ row }) => {
        const title = row.getValue('title')
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
