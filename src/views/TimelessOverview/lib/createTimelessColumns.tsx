import { Title } from '@/components/Table/Items/Title'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import type { TimelessArticle } from '@/shared/schemas/timelessArticle'
import type { IDBTimelessCategory } from 'src/datastore/types'
import { dateToReadableDateTime } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@ttab/elephant-ui'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import {
  BookmarkIcon,
  CalendarIcon,
  CalendarPlusIcon,
  CircleCheckIcon,
  MoreVerticalIcon,
  PenBoxIcon
} from '@ttab/elephant-ui/icons'
import type { TFunction, Namespace } from 'i18next'
import type { TranslationKey } from '@/types/i18next.d'
import { TimelessRowActions } from './TimelessRowActions'

const TIMELESS_STATUSES = ['draft', 'done', 'used'] as const

export function createTimelessColumns<Ns extends Namespace>({
  locale,
  timeZone,
  categories = [],
  t
}: {
  locale: LocaleData
  timeZone: string
  categories?: IDBTimelessCategory[]
  t: TFunction<Ns>
}): Array<ColumnDef<TimelessArticle>> {
  return [
    {
      id: 'status',
      meta: {
        options: TIMELESS_STATUSES.map((status) => ({
          value: status,
          label: t(`core:status.${status}` as TranslationKey)
        })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: t('core:labels.status'),
        columnIcon: CircleCheckIcon,
        className: 'flex-none',
        display: (value: string) => (
          <span>{t(`core:status.${value}` as TranslationKey)}</span>
        )
      },
      accessorFn: (data) => data.fields['workflow_state']?.values[0],
      cell: ({ row }) => {
        const status = row.getValue<string>('status')
        if (!status) {
          return <span className='text-muted-foreground'>-</span>
        }
        return <DocumentStatus type='core/article' status={status} />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
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
        options: categories.map((cat) => ({ value: cat.id, label: cat.title })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        quickFilter: true,
        name: t('views:timeless.columnLabels.category'),
        columnIcon: BookmarkIcon,
        className: 'flex-none w-[150px]',
        display: (value: string) => (
          <span>
            {categories.find((cat) => cat.id === value)?.title}
          </span>
        )
      },
      accessorFn: (data) => data.fields['document.rel.subject.uuid']?.values[0],
      cell: ({ row }) => {
        const categoryId = row.getValue<string>('category')
        const category = categories.find((cat) => cat.id === categoryId)
        if (!category) {
          return <span className='text-muted-foreground'>-</span>
        }
        return (
          <Badge variant='outline' className='rounded-md bg-background h-7' data-row-action>
            <div className='hidden @5xl/view:[display:revert] h-2 w-2 rounded-full mr-2 bg-[#7C6F9C]' data-row-action />
            <span className='text-muted-foreground text-sm font-normal whitespace-nowrap' data-row-action>
              {category.title}
            </span>
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    {
      id: 'created',
      meta: {
        name: t('views:timeless.columnLabels.created'),
        columnIcon: CalendarPlusIcon,
        className: 'flex-none hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => data.fields['created']?.values[0],
      cell: ({ row }) => {
        const date = row.getValue<string>('created')
        const readable = date
          ? dateToReadableDateTime(new Date(date), locale.code.full, timeZone, true)
          : '-'
        return (
          <span className='font-thin text-sm text-muted-foreground'>
            {readable}
          </span>
        )
      }
    },
    {
      id: 'modified',
      meta: {
        name: t('views:timeless.columnLabels.lastChanged'),
        columnIcon: CalendarIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => data.fields['modified']?.values[0],
      cell: ({ row }) => {
        const date = row.getValue<string>('modified')
        const readable = date
          ? dateToReadableDateTime(new Date(date), locale.code.full, timeZone, true)
          : '-'
        return (
          <span className='font-thin text-sm text-muted-foreground'>
            {readable}
          </span>
        )
      }
    },
    {
      id: 'actions',
      meta: {
        name: t('views:timeless.columnLabels.actions'),
        columnIcon: MoreVerticalIcon,
        className: 'flex-none w-[50px]'
      },
      cell: ({ row }) => {
        const documentId = row.original.id
        const status = row.getValue<string>('status')
        return <TimelessRowActions documentId={documentId} status={status} />
      }
    }
  ]
}
