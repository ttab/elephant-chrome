
import { Title } from '@/components/Table/Items/Title'
import { type ColumnDef } from '@tanstack/react-table'
import { Pen, SignalHigh } from '@ttab/elephant-ui/icons'
import type { PrintArticle } from '@/hooks/index/lib/printArticles'

export function printArticlesListColumns({ locale = 'sv-SE' }: {
  locale?: string
}): Array<ColumnDef<PrintArticle>> {
  return [
    {
      id: 'modified',
      enableGrouping: false,
      meta: {
        name: 'Tidz',
        columnIcon: SignalHigh,
        display: (value: string) => {
          const [hour, day] = value.split(' ')
          return (
            <div className='flex gap-3'>
              <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
                {hour}
              </span>
              <span>{day}</span>
            </div>
          )
        }
      },
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
