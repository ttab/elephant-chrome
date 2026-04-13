import { Title } from '@/components/Table/Items/Title'
import type { TimelessArticle } from '@/shared/schemas/timelessArticle'
import { dateToReadableDateTime } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import type { ColumnDef } from '@tanstack/react-table'
import { BookmarkIcon, CalendarIcon, PenBoxIcon } from '@ttab/elephant-ui/icons'
import type { TFunction, Namespace } from 'i18next'

export function createTimelessColumns<Ns extends Namespace>({ locale, timeZone, t }: {
  locale: LocaleData
  timeZone: string
  t: TFunction<Ns>
}): Array<ColumnDef<TimelessArticle>> {
  return [
    {
      id: 'title',
      meta: {
        name: t('core:labels.title'),
        columnIcon: PenBoxIcon,
        className: 'flex-1'
      },
      accessorFn: (data) => data.fields['document.title']?.values[0],
      cell: ({ row }) => {
        return <Title title={row.getValue<string>('title')} />
      }
    },
    {
      id: 'category',
      meta: {
        name: t('views:timeless.columnLabels.category'),
        columnIcon: BookmarkIcon,
        className: 'flex-none w-[150px]'
      },
      accessorFn: (data) => data.fields['document.rel.subject.title']?.values[0],
      cell: ({ row }) => {
        const category = row.getValue<string>('category')
        return (
          <span className='font-thin text-sm text-muted-foreground truncate'>
            {category || '-'}
          </span>
        )
      }
    },
    {
      id: 'date',
      meta: {
        name: t('views:timeless.columnLabels.lastChanged'),
        columnIcon: CalendarIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => data.fields['modified']?.values[0],
      cell: ({ row }) => {
        const date = row.getValue<string>('date')
        const readable = date
          ? dateToReadableDateTime(new Date(date), locale.code.full, timeZone, true)
          : '-'
        return (
          <span className='font-thin text-sm text-muted-foreground'>
            {readable}
          </span>
        )
      }
    }
  ]
}
