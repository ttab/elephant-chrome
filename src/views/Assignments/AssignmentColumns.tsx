
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
import { parseISO } from 'date-fns'
import { ActionMenu } from '@/components/ActionMenu'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { selectableStatuses } from '../Planning/components/AssignmentStatus'
import type { PreprocessedAssignmentData } from './preprocessor'

export function assignmentColumns({ authors = [], locale, timeZone, sections = [], currentDate }: {
  authors?: IDBAuthor[]
  sections?: IDBSection[]
  locale: LocaleData
  timeZone: string
  currentDate: Date
}): ColumnDef<PreprocessedAssignmentData>[] {
  return [
    {
      id: 'deliverableStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: [...DocumentStatuses, ...selectableStatuses],
        name: 'Status',
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
        const { startValue, startType } = data._preprocessed
        if (startType === 'publish_slot') {
          return startValue
        }

        if (startType === 'full_day') {
          return 'Heldag'
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

        // Heldag comes first
        if (a === 'Heldag' && b !== 'Heldag') return -1
        if (a !== 'Heldag' && b === 'Heldag') return 1
        if (a === 'Heldag' && b === 'Heldag') return 0

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
        name: 'Titel',
        columnIcon: BriefcaseIcon,
        className: 'flex-1'
      },
      accessorFn: (data) => data._preprocessed.assignmentTitle,
      cell: ({ row }) => {
        const assignmentTitle = row.getValue<string>('title')
        const planningTitle = row.original.document?.title
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
        name: 'Sektion',
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
        name: 'Nyhetsvärde',
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
        name: 'Uppdragstagare',
        columnIcon: UsersIcon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data._preprocessed.assigneeUuids,
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
        name: 'Uppdragstid',
        columnIcon: Clock3Icon,
        className: 'flex-none @5xl/view:w-[112px] w-[50px]'
      },
      accessorFn: (data) => data._assignment?.data.start || '',
      cell: ({ row }) => {
        const { startValue, startType } = row.original._preprocessed

        if (!startValue || startValue === 'Heldag' || startValue === '??') {
          return <Time time={startValue || ''} type={startType || ''} tooltip='Uppdragets starttid' />
        }
        const formattedStart = dateInTimestampOrShortMonthDayTimestamp(
          startValue, locale.code.full, timeZone, currentDate
        )

        if (startType === 'publish_slot') {
          const slotFormatted = Object.entries(timesSlots)
            .find((slot) => slot[1].slots.includes(parseInt(startValue, 10)))?.[1]?.label
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
          <FacetedFilter
            column={column}
            setSearch={setSearch}
            facetFn={() => getNestedFacetedUniqueValues(column)}
          />
        ),
        options: AssignmentTypes,
        name: 'Typ',
        columnIcon: CrosshairIcon,
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
      accessorFn: (data) => data._preprocessed.assignmentTypes,
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
        name: 'Action',
        columnIcon: NavigationIcon,
        className: 'flex-none p-0'
      },
      cell: ({ row }) => {
        const deliverableUuid = row.original._preprocessed.deliverableUuid || ''
        const planningId = row.original.document?.uuid
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
