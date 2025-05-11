import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Briefcase, Clock3Icon, Crosshair, Navigation, SignalHigh, Users, Shapes } from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults/newsvalues'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'
import { getNestedFacetedUniqueValues } from '@/components/Table/lib/getNestedFacetedUniqueValues'
import { Assignees } from '@/components/Table/Items/Assignees'
import { AssignmentTitles } from '@/components/Table/Items/AssignmentTitles'
import { dateInTimestampOrShortMonthDayTimestamp } from '@/lib/datetime'
import { type ColumnDef } from '@tanstack/react-table'
import type { LocaleData } from '@/types/index'
import type { IDBSection, IDBAuthor } from 'src/datastore/types'
import { slotLabels, timesSlots } from '@/defaults/assignmentTimeslots'
import { Time } from './Time'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import type { Assignment } from '@/hooks/index/useDocuments/schemas/assignments'
import { parseISO } from 'date-fns'
import { ActionMenu } from '@/components/ActionMenu'

export function assignmentColumns({ authors = [], locale, timeZone, sections = [], currentDate }: {
  authors?: IDBAuthor[]
  sections?: IDBSection[]
  locale: LocaleData
  timeZone: string
  currentDate: Date
}): Array<ColumnDef<Assignment>> {
  return [
    // Used for start time grouping
    {
      id: 'startTime',
      meta: {
        name: 'Uppdragstid',
        columnIcon: Clock3Icon,
        className: '',
        display: (value: string) => {
          const [hour, day] = value.split(' ')
          if (hour === 'undefined' || hour === 'Heldag') {
            return <span>Heldag</span>
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
          return 'Heldag'
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
        name: 'Titel',
        columnIcon: Briefcase,
        className: 'flex-1'
      },
      accessorFn: (data) => data.fields['document.meta.core_assignment.title']?.values,
      cell: ({ row }) => {
        const assignmentTitle = row.getValue<string[]>('title')?.join(' ') || ''
        const planningTitle = row.original.fields['document.title'].values[0] || ''
        return <AssignmentTitles planningTitle={planningTitle} assignmentTitle={assignmentTitle} />
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
        name: 'Sektion',
        columnIcon: Shapes,
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]',
        display: (value: string) => (
          <span>
            {sections
              .find((section) => section.id === value)?.title}
          </span>
        )
      },
      accessorFn: (data) => data.fields['document.rel.section.title']?.values[0],
      cell: ({ row }) => {
        const sectionTitle = row.getValue<string>('section')
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
        name: 'Nyhetsvärde',
        columnIcon: SignalHigh,
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
        options: authors.map((a) => ({ value: a.name, label: a.name })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        name: 'Uppdragstagare',
        columnIcon: Users,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data.fields['document.meta.core_assignment.rel.assignee.title']?.values,
      cell: ({ row }) => {
        const assignees = row.getValue<string[]>('assignees') || []
        return <Assignees assignees={assignees} />
      },
      filterFn: (row, id, value: string[]) => {
        const assignees = row.getValue<string[]>(id) || []
        return (
          typeof value[0] === 'string'
            ? assignees.includes(value[0])
            : false
        )
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
        name: 'Uppdragstid',
        columnIcon: Clock3Icon,
        className: 'flex-none @5xl/view:w-[112px] w-[50px]'
      },
      accessorFn: (data) => data.fields['document.start_time.value'].values[0],
      cell: ({ row }) => {
        const startTime = row.getValue<string>('assignment_time')
        const startTimeType = row.original.fields['document.start_time.type'].values[0]

        if (!startTime || startTime === 'Heldag' || startTime === '??') {
          return <Time time={startTime} type={startTimeType} tooltip='Uppdragets starttid' />
        }
        const formattedStart = dateInTimestampOrShortMonthDayTimestamp(
          startTime, locale.code.full, timeZone, currentDate
        )

        if (startTimeType === 'publish_slot') {
          const slotFormatted = Object.entries(timesSlots).find((slot) => slot[1].slots.includes(parseInt(startTime, 10)))?.[1]?.label
          return <div className='items-center'>{slotFormatted}</div>
        }
        return <Time time={formattedStart} type='start' tooltip='Uppdragets starttid' />
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
        name: 'Typ',
        columnIcon: Crosshair,
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4',
        display: (value: string | string[]) => {
          const items = AssignmentTypes
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
            className='items-start'
          />
        )
      },
      filterFn: (row, id, value: string[]) =>
        value.some((v: string) => row.getValue<string[] | undefined>(id)?.includes(v))
    },
    {
      id: 'action',
      meta: {
        name: 'Action',
        columnIcon: Navigation,
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
                  title: 'Öppna artikel'
                },

                {
                  to: 'Planning',
                  id: planningId,
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
