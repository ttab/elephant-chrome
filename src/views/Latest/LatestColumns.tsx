import { type ColumnDef } from '@tanstack/react-table'
import {
  Clock3Icon,
  NavigationIcon,
  ShapesIcon,
  BriefcaseIcon,
  ZapIcon,
  FileWarningIcon,
  FileTextIcon,
  CalendarDaysIcon,
  LibraryIcon,
  PenIcon
} from '@ttab/elephant-ui/icons'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { dateInTimestampOrShortMonthDayTimestamp } from '@/shared/datetime'
import type { LocaleData } from '@/types/index'
import type { PreprocessedLatestData } from './preprocessor'
import { Title } from '@/components/Table/Items/Title'
import { DotMenu } from '@/components/ui/DotMenu'
import { Link } from '@/components'
import { CreatePrintArticle } from '@/components/CreatePrintArticle'
import { useModal } from '@/components/Modal/useModal'
import { resolveDeliverableNavigation } from '@/lib/resolveDeliverableNavigation'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

export function latestColumns({ locale, timeZone, t }: {
  locale: LocaleData
  timeZone: string
  t: TFunction
}): ColumnDef<PreprocessedLatestData>[] {
  return [
    {
      id: 'deliverableType',
      meta: {
        name: t('core:labels.type'),
        columnIcon: BriefcaseIcon,
        className: 'flex-none w-10'
      },
      accessorFn: (data) => data._preprocessed.deliverableType || '',
      cell: ({ row }) => {
        const type = row.getValue<string>('deliverableType')
        if (!type) return null

        if (type === 'core/flash') {
          return <ZapIcon strokeWidth={1.75} size={16} className='text-red-500 -mt-px' />
        }
        if (type === 'core/editorial-info') {
          return <FileWarningIcon strokeWidth={1.75} size={16} className='-mt-px' />
        }
        return <FileTextIcon strokeWidth={1.75} size={16} className='-mt-px' />
      }
    },
    {
      id: 'title',
      meta: {
        name: t('core:labels.title'),
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
        name: t('core:labels.section'),
        columnIcon: ShapesIcon,
        className: 'flex-none w-[145px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => data._preprocessed.sectionUuid || '',
      cell: ({ row }) => {
        const sectionTitle = row.original._preprocessed.sectionTitle
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
        name: t('views:latest.columnLabels.publishTime'),
        columnIcon: Clock3Icon,
        className: 'flex-none tabular-nums w-[100px] text-right'
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
        name: t('core:labels.action'),
        columnIcon: NavigationIcon,
        className: 'flex-none p-0'
      },
      cell: ({ row }) => <LatestActionMenu data={row.original._preprocessed} />
    }
  ]
}

function LatestActionMenu({ data }: {
  data: PreprocessedLatestData['_preprocessed']
}) {
  const { showModal, hideModal } = useModal()
  const { t } = useTranslation()
  const { deliverableUuid, deliverableType, planningId } = data
  const { view, label } = resolveDeliverableNavigation(deliverableType)

  return (
    <div className='shrink p-1'>
      <DotMenu
        items={[
          {
            label,
            item: (
              <Link to={view} target='last' props={{ id: deliverableUuid || '' }} className='flex flex-row gap-5'>
                <div className='pt-1'>
                  <PenIcon size={14} strokeWidth={1.5} className='shrink' />
                </div>
                <div className='grow'>{label}</div>
              </Link>
            )
          },
          {
            label: t('views:latest.actions.openPlanning'),
            disabled: !planningId,
            item: planningId
              ? (
                  <Link to='Planning' target='last' props={{ id: planningId }} className='flex flex-row gap-5'>
                    <div className='pt-1'>
                      <CalendarDaysIcon size={14} strokeWidth={1.5} className='shrink' />
                    </div>
                    <div className='grow'>{t('views:latest.actions.openPlanning')}</div>
                  </Link>
                )
              : () => {}
          },
          {
            label: t('views:latest.actions.createPrintArticle'),
            icon: LibraryIcon,
            item: () => {
              showModal(
                <CreatePrintArticle
                  id={deliverableUuid || ''}
                  asDialog
                  onDialogClose={hideModal}
                />
              )
            }
          }
        ]}
      />
    </div>
  )
}
