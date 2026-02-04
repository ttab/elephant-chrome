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
import { AssignmentTypes, isVisualAssignmentType } from '@/defaults/assignmentTypes'
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
import type { Assignment } from '@/shared/schemas/assignments'
import { parseISO } from 'date-fns'
import { ActionMenu } from '@/components/ActionMenu'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { selectableStatuses } from '../Planning/components/AssignmentStatus'
import type { TFunction } from 'i18next'

export function assignmentColumns({ authors = [], locale, timeZone, sections = [], currentDate, t }: {
  authors?: IDBAuthor[]
  sections?: IDBSection[]
  locale: LocaleData
  timeZone: string
  currentDate: Date
  t: TFunction<string>
}): Array<ColumnDef<Assignment>> {
  return [
    {
      id: 'deliverableStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: [...DocumentStatuses, ...selectableStatuses],
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
        const type = data.fields['document.meta.core_assignment.meta.core_assignment_type.value']?.values[0]

        // If visual assignment, return assignment status
        if (isVisualAssignmentType(type)) {
          const assignmentStatus = data.fields['document.meta.core_assignment.data.status']?.values[0]
          return assignmentStatus || 'todo'
        }

        const currentStatus = data?.fields['document.meta.status']?.values[0]
        return currentStatus
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('deliverableStatus')
        const type = row.original.fields['document.meta.core_assignment.meta.core_assignment_type.value']?.values[0] || 'core/article'
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
          if (hour === 'undefined' || hour === t('core:timeSlots.fullDay')) {
            return <span>{t('core:timeSlots.fullDay')}</span>
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
        const startTime = data.fields['document.start_time.value'].values[0]
        const startTimeType = data.fields['document.start_time.type'].values[0]

        if (startTimeType === 'publish_slot') {
          return startTime
        }

        if (startTimeType === 'full_day') {
          return t('core:timeSlots.fullDay')
        }

        const startDate = parseISO(startTime)
        if (startDate.toDateString() === currentDate.toDateString()) {
          return startDate.getHours()
        } else {
          return `${startDate.getHours()} ${startDate.toLocaleString(locale.code.full, { weekday: 'long', hourCycle: 'h23' })}`
        }
      },
      sortingFn: 'basic',
      enableGrouping: true,
      enableSorting: false
    },
    {
      id: 'title',
      meta: {
        name: t('core:labels.title'),
        columnIcon: BriefcaseIcon,
        className: 'flex-1'
      },
      accessorFn: (data) => data.fields['document.meta.core_assignment.title']?.values,
      cell: ({ row }) => {
        const assignmentTitle = row.getValue<string[]>('title')?.join(' ') || ''
        const planningTitle = row.original.fields['document.title'].values[0] || ''
        const assignees = (row.getValue<string[]>('assignees') || []).map((assigneeId) => {
          return authors.find((author) => author.id === assigneeId)?.name || ''
        })

        return (
          <>
            <AssignmentTitles planningTitle={planningTitle} assignmentTitle={assignmentTitle} />
            <div className='display:revert @5xl/view:[display:none] pt-2'>
              <Assignees assignees={assignees} />
            </div>
          </>
        )
      },
      enableGrouping: false
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
      accessorFn: (data) => data.fields['document.rel.section.uuid']?.values[0],
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
      accessorFn: (data) => data.fields['document.meta.core_newsvalue.value']?.values[0],
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
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data.fields['document.meta.core_assignment.rel.assignee.uuid']?.values,
      cell: ({ row }) => {
        const assignees = (row.getValue<string[]>('assignees') || []).map((assigneeId) => {
          return authors.find((author) => author.id === assigneeId)?.name || ''
        })

        return <Assignees assignees={assignees} />
      },
      filterFn: (row, id, value: string[]) => {
        const assignees = row.getValue<string[]>(id) || []
        return value.some((v) => assignees.includes(v))
      },
      enableGrouping: false
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
      accessorFn: (data) => data.fields['document.start_time.value'].values[0],
      cell: ({ row }) => {
        const startTime = row.getValue<string>('assignment_time')
        const startTimeType = row.original.fields['document.start_time.type'].values[0]

        if (!startTime || startTime === t('core:timeSlots.fullDay') || startTime === '??') {
          return <Time time={startTime} type={startTimeType} tooltip={t('views:assignments.tooltips.assignmentStartTime')} />
        }
        const formattedStart = dateInTimestampOrShortMonthDayTimestamp(
          startTime, locale.code.full, timeZone, currentDate
        )

        if (startTimeType === 'publish_slot') {
          const slotFormatted = Object.entries(timesSlots).find((slot) => slot[1].slots.includes(parseInt(startTime, 10)))?.[1]?.label
          return (
            <div className='items-center'>
              {slotFormatted && t(`core:timeSlots.${slotFormatted}`)}
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
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        options: AssignmentTypes,
        name: t('views:assignments.columnLabels.type'),
        columnIcon: CrosshairIcon,
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4',
        display: (value: string | string[]) => {
          const items = AssignmentTypes
            .filter((type) => value.includes(type.value))
            .map((item) => t(`shared:assignmentTypes.${item.value}`))
          return (
            <div className='flex flex-row gap-2'>
              <span>
                {items.join('/')}
              </span>
            </div>
          )
        }
      },
      accessorFn: (data) => data.fields['document.meta.core_assignment.meta.core_assignment_type.value']?.values,
      cell: ({ row }) => {
        const data = AssignmentTypes.filter(
          (assignmentType) => (row.getValue<string[]>('assignmentType') || [])
            .includes(assignmentType.value)
        )
        if (data.length === 0) {
          return null
        }

        return (
          <Type
            data={data}
            deliverableId={row.original
              .fields['document.meta.core_assignment.rel.deliverable.uuid']
              .values[0]}
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
        const deliverableUuid = row.original?.fields['document.meta.core_assignment.rel.deliverable.uuid']?.values[0] || ''
        const planningId = row.original.id
        return (
          <div className='shrink p-'>
            <ActionMenu
              actions={[
                {
                  to: 'Editor',
                  id: deliverableUuid,
                  title: t('views:assignments.actionMenu.openArticle')
                },

                {
                  to: 'Planning',
                  id: planningId,
                  title: t('views:assignments.actionMenu.openPlanning')
                }
              ]}
            />
          </div>
        )
      }
    }
  ]
}
