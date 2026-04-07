
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import {
  BriefcaseIcon,
  Clock3Icon,
  CrosshairIcon,
  NavigationIcon,
  SignalHighIcon,
  UsersIcon,
  ShapesIcon,
  CircleCheckIcon
} from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults/newsvalues'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { getAssignmentTypes, isVisualAssignmentType } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'
import { getNestedFacetedUniqueValues } from '@/components/Table/lib/getNestedFacetedUniqueValues'
import { Assignees } from '@/components/Table/Items/Assignees'
import { AssignmentTitles } from '@/components/Table/Items/AssignmentTitles'
import { dateInTimestampOrShortMonthDayTimestamp } from '@/shared/datetime'
import { type ColumnDef } from '@tanstack/react-table'
import type { LocaleData } from '@/types/index'
import type { IDBSection, IDBAuthor } from 'src/datastore/types'
import { slotLabels, timesSlots } from '@/defaults/assignmentTimeslots'
import { Time } from './Time'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { parseISO } from 'date-fns'
import { DotMenu } from '@/components/ui/DotMenu'
import { Link } from '@/components'
import { PenIcon, CalendarDaysIcon } from '@ttab/elephant-ui/icons'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { getDocumentStatuses } from '@/defaults/documentStatuses'
import { selectableStatuses } from '../Planning/components/AssignmentStatus'
import type { PreprocessedAssignmentData } from './preprocessor'
import { resolveDeliverableNavigation } from '@/lib/resolveDeliverableNavigation'
import type { TFunction, Namespace } from 'i18next'
import type { TranslationKey } from '@/types/i18next.d'

export function assignmentColumns<Ns extends Namespace>({ authors = [], locale, timeZone, sections = [], currentDate, t }: {
  authors?: IDBAuthor[]
  sections?: IDBSection[]
  locale: LocaleData
  timeZone: string
  currentDate: Date
  t: TFunction<Ns>
}): ColumnDef<PreprocessedAssignmentData>[] {
  return [
    {
      id: 'deliverableStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: [...getDocumentStatuses(), ...selectableStatuses],
        name: t('core:labels.status'),
        columnIcon: CircleCheckIcon,
        className: 'flex-none',
        display: (value: string) => (
          <span>
            <DocumentStatus type='core/article' status={value} />
          </span>
        )
      },
      accessorFn: (data) => {
        const type = data._preprocessed.assignmentTypes[0]

        // If visual assignment, return assignment status
        if (isVisualAssignmentType(type)) {
          const assignmentStatus = data._assignment?.data.status
          return assignmentStatus || 'todo'
        }

        return data._preprocessed.deliverableStatus || '?'
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('deliverableStatus')
        const type = row.original._preprocessed.assignmentTypes[0]

        return <DocumentStatus type={type} status={status} />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id)),
      enableColumnFilter: true
    },
    // Used for start time grouping
    {
      id: 'startTime',
      meta: {
        name: t('views:assignments.columnLabels.assignmentTime'),
        columnIcon: Clock3Icon,
        className: '',
        display: (value: string) => {
          const [hour, day] = value.split(' ')
          if (hour === 'undefined' || hour === t('core:timeSlots.fullday')) {
            return <span>{t('core:timeSlots.fullday')}</span>
          }

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
        const { startValue, startType } = data._preprocessed
        if (startType === 'publish_slot') {
          return startValue
        }

        if (startType === 'full_day') {
          return t('core:timeSlots.fullday')
        }

        const startDate = parseISO(startValue || '')
        if (startDate.toDateString() === currentDate.toDateString()) {
          return startDate.getHours()
        } else {
          return `${startDate.getHours()} ${startDate.toLocaleString(locale.code.full, { weekday: 'long', hourCycle: 'h23' })}`
        }
      },
      sortingFn: (rowA, rowB) => {
        const a = rowA.getValue<number | string>('startTime')
        const b = rowB.getValue<number | string>('startTime')

        // Full day comes first
        const fullday = t('core:timeSlots.fullday')
        if (a === fullday && b !== fullday) return -1
        if (a !== fullday && b === fullday) return 1
        if (a === fullday && b === fullday) return 0

        // Numbers in ascending order
        const numA = typeof a === 'number' ? a : Number(String(a).split(' ')[0])
        const numB = typeof b === 'number' ? b : Number(String(b).split(' ')[0])

        return numA - numB
      },
      enableGrouping: true,
      enableSorting: true
    },
    {
      id: 'title',
      meta: {
        name: t('core:labels.title'),
        columnIcon: BriefcaseIcon,
        className: 'flex-1 min-w-0'
      },
      accessorFn: (data) => data._preprocessed.assignmentTitle,
      cell: ({ row }) => {
        const assignmentTitle = row.getValue<string>('title')
        const planningTitle = row.original._preprocessed?.title ?? row.original.document?.title
        const assignees = (row.getValue<string[]>('assignees') || []).map((assigneeId) => {
          return authors.find((author) => author.id === assigneeId)?.name || ''
        })

        return (
          <div className='flex items-center gap-2 min-w-0'>
            <div className='min-w-0 flex-1'>
              <AssignmentTitles planningTitle={planningTitle} assignmentTitle={assignmentTitle} />
            </div>
            <div className='flex-none display:revert @5xl/view:[display:none]'>
              <Assignees assignees={assignees} />
            </div>
          </div>
        )
      },
      enableGrouping: false,
      enableGlobalFilter: true
    },
    {
      id: 'section',
      meta: {
        options: sections.map((_) => {
          return {
            value: _.id,
            label: _.title
          }
        }),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: t('core:labels.section'),
        columnIcon: ShapesIcon,
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]',
        display: (value: string) => (
          <span>
            {sections
              .find((section) => section.id === value)?.title}
          </span>
        )
      },
      accessorFn: (data) => data._preprocessed.sectionUuid || '',
      cell: ({ row }) => {
        const sectionTitle = sections
          .find((section) => section.id === row.getValue('section'))?.title
        return (
          <>
            {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
          </>
        )
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    {
      id: 'newsvalue',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: Newsvalues,
        name: t('core:labels.newsvalue'),
        columnIcon: SignalHighIcon,
        className: 'box-content w-4 sm:w-8 pr-1 sm:pr-4 hidden sm:[display:revert]'
      },
      accessorFn: (data) => data._preprocessed.newsvalue || '',
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]

        if (newsvalue) {
          return <Newsvalue newsvalue={newsvalue} />
        }
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    {
      id: 'assignees',
      meta: {
        options: authors.map((a) => ({ value: a.id, label: a.name })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        name: t('core:labels.assignee'),
        columnIcon: UsersIcon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]',
        display: (value: string) => {
          const names = value.split(',').filter(Boolean)
          return <Assignees assignees={names} tooltip={false} />
        }
      },
      accessorFn: (data) => data._preprocessed.assigneeUuids,
      getGroupingValue: (data) => {
        const assignees = data._preprocessed.assigneeUuids ?? []
        return assignees
          .map((uuid) => authors.find((a) => a.id === uuid)?.name ?? '??')
          .sort((a, b) => a.localeCompare(b))
          .join(',')
      },
      cell: ({ row }) => {
        const assignees = (row.getValue<string[]>('assignees') || [])
          .map((assigneeId) => authors.find((author) => author.id === assigneeId)?.name || '')
          .sort((a, b) => a.localeCompare(b))

        return <Assignees assignees={assignees} />
      },
      sortingFn: (rowA, rowB, columnId) => {
        const toKey = (row: typeof rowA) =>
          (row.getValue<string[]>(columnId) || [])
            .map((uuid) => authors.find((a) => a.id === uuid)?.name ?? '??')
            .sort((a, b) => a.localeCompare(b))
            .join(',')
        return toKey(rowA).localeCompare(toKey(rowB))
      },
      filterFn: (row, id, value: string[]) => {
        const assignees = row.getValue<string[]>(id) || []
        return value.some((v) => assignees.includes(v))
      },
      enableGrouping: true
    },
    {
      id: 'assignment_time',
      meta: {
        options: slotLabels,
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: t('views:assignments.columnLabels.assignmentTime'),
        columnIcon: Clock3Icon,
        className: 'flex-none @5xl/view:w-[112px] w-[50px]'
      },
      accessorFn: (data) => data._assignment?.data.start || '',
      cell: ({ row }) => {
        const { startValue, startType } = row.original._preprocessed

        if (!startValue || startValue === t('core:timeSlots.fullday') || startValue === '??') {
          return <Time time={startValue || ''} type={startType || ''} tooltip={t('views:assignments.tooltips.assignmentStartTime')} />
        }
        const formattedStart = dateInTimestampOrShortMonthDayTimestamp(
          startValue, locale.code.full, timeZone, currentDate
        )

        if (startType === 'publish_slot') {
          const slotFormatted = Object.entries(timesSlots)
            .find((slot) => slot[1].slots.includes(parseInt(startValue, 10)))?.[1]?.label
          return (
            <div className='items-center'>
              {slotFormatted && t(`core:timeSlots.${slotFormatted}` as TranslationKey)}
            </div>
          )
        }
        return <Time time={formattedStart} type='start' tooltip={t('views:assignments.tooltips.assignmentStartTime')} />
      },

      sortingFn: 'basic',
      enableSorting: true,
      enableGrouping: false
    },
    {
      id: 'assignmentType',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter
            column={column}
            setSearch={setSearch}
            facetFn={() => getNestedFacetedUniqueValues(column)}
          />
        ),
        options: getAssignmentTypes(),
        name: t('views:assignments.columnLabels.type'),
        columnIcon: CrosshairIcon,
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4',
        display: (value: string | string[]) => {
          const items = getAssignmentTypes()
            .filter((type) => value.includes(type.value))
            .map((item) => item.label)
          return (
            <div className='flex flex-row gap-2'>
              <span>
                {items.join('/')}
              </span>
            </div>
          )
        }
      },
      accessorFn: (data) => data._preprocessed.assignmentTypes,
      cell: ({ row }) => {
        const data = getAssignmentTypes().filter(
          (assignmentType) => (row.getValue<string[]>('assignmentType') || [])
            .includes(assignmentType.value)
        )
        if (data.length === 0) {
          return null
        }

        return (
          <Type
            data={data}
            deliverableId={row.original._preprocessed.deliverableUuid}
            className='items-start hidden @5xl/view:[display:revert]'
          />
        )
      },
      filterFn: (row, id, value: string[]) =>
        value.some((v: string) => row.getValue<string[] | undefined>(id)?.includes(v))
    },
    {
      id: 'action',
      meta: {
        name: t('core:labels.action'),
        columnIcon: NavigationIcon,
        className: 'flex-none p-0'
      },
      cell: ({ row }) => {
        const { deliverableUuid, deliverableType } = row.original._preprocessed
        const planningId = row.original.document?.uuid
          ?? row.original.id?.split('-assignment-')[0]
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

                  label: t('views:assignments.actionMenu.openPlanning'),
                  disabled: !planningId,
                  item: planningId
                    ? (
                        <Link to='Planning' target='last' props={{ id: planningId }} className='flex flex-row gap-5'>
                          <div className='pt-1'>
                            <CalendarDaysIcon size={14} strokeWidth={1.5} className='shrink' />
                          </div>
                          <div className='grow'>{t('views:assignments.actionMenu.openPlanning')}</div>
                        </Link>
                      )
                    : () => {}
                }
              ]}
            />
          </div>
        )
      }
    }
  ]
}
