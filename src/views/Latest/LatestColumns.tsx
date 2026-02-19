import { type ColumnDef } from '@tanstack/react-table'
import {
  Clock3Icon,
  NavigationIcon,
  ShapesIcon,
  BriefcaseIcon,
  ZapIcon,
  FileWarningIcon,
  FileTextIcon
} from '@ttab/elephant-ui/icons'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { ActionMenu } from '@/components/ActionMenu'
import { dateInTimestampOrShortMonthDayTimestamp } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import type { IDBSection } from 'src/datastore/types'
import type { PreprocessedLatestData } from './preprocessor'
import { Title } from '@/components/Table/Items/Title'

export function latestColumns({ locale, timeZone, sections = [] }: {
  locale: LocaleData
  timeZone: string
  sections?: IDBSection[]
}): ColumnDef<PreprocessedLatestData>[] {
  return [
    {
      id: 'deliverableType',
      meta: {
        name: 'Typ',
        columnIcon: BriefcaseIcon,
        className: 'flex-none w-6'
      },
      accessorFn: (data) => data._preprocessed.deliverableType || '',
      cell: ({ row }) => {
        const type = row.getValue<string>('deliverableType')
        console.log('deliverableType', type)
        if (!type) return null

        if (type === 'core/flash') {
          return <ZapIcon strokeWidth={1.75} size={14} className='text-red-500' />
        }
        if (type === 'core/editorial-info') {
          return <FileWarningIcon size={14} />
        }
        return <FileTextIcon size={14} />
      }
    },
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: BriefcaseIcon,
        className: 'flex-1 min-w-0'
      },
      accessorFn: (data) => data._preprocessed.title || '',
      cell: ({ row }) => {
        const slugline = (row.original)._preprocessed?.slugline
        const title = row.getValue<string>('title')

        return <Title title={title} slugline={slugline} />
      }
    },
    {
      id: 'section',
      meta: {
        name: 'Sektion',
        columnIcon: ShapesIcon,
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => data._preprocessed.sectionUuid || '',
      cell: ({ row }) => {
        const sectionTitle = row.original._preprocessed.sectionTitle
          || sections.find((s) => s.id === row.getValue('section'))?.title
        return (
          <>
            {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
          </>
        )
      }
    },
    {
      id: 'publishTime',
      meta: {
        name: 'Publiceringstid',
        columnIcon: Clock3Icon,
        className: ''
      },
      accessorFn: (data) => data._preprocessed.publishTime || '',
      cell: ({ row }) => {
        const publishTime = row.getValue<string>('publishTime')
        if (!publishTime) return null

        const formatted = dateInTimestampOrShortMonthDayTimestamp(
          publishTime, locale.code.full, timeZone, new Date()
        )
        return <span className='text-muted-foreground text-xs'>{formatted}</span>
      },
      sortingFn: 'basic',
      enableSorting: true
    },
    {
      id: 'action',
      meta: {
        name: 'Action',
        columnIcon: NavigationIcon,
        className: 'flex-none p-0'
      },
      cell: ({ row }) => {
        const deliverableUuid = row.original._preprocessed.deliverableUuid || ''
        const planningId = row.original._preprocessed.planningId
        return (
          <div className='shrink p-'>
            <ActionMenu
              actions={[
                {
                  to: 'Editor',
                  id: deliverableUuid,
                  title: 'Öppna artikel'
                },
                {
                  to: 'Planning',
                  id: planningId || '',
                  title: 'Öppna planering'
                }
              ]}
            />
          </div>
        )
      }
    }
  ]
}
