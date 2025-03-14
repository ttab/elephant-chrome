
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
import { Actions } from '@/components/Table/Items/Actions'
import { dateInTimestampOrShortMonthDayTimestamp } from '@/lib/datetime'
import { type ColumnDef } from '@tanstack/react-table'
import { type DefaultValueOption } from '@/types/index'
import type { IDBSection, IDBAuthor } from 'src/datastore/types'
import type {
  AssignmentMetaExtended,
  MetaValueType,
  AssigneeMeta
} from './types'
import { slotLabels, timesSlots } from '@/defaults/assignmentTimeslots'
import { Time } from './Time'
import { SectionBadge } from '@/components/DataItem/SectionBadge'

export function assignmentColumns({ authors = [], locale, timeZone, sections = [] }: {
  authors?: IDBAuthor[]
  sections?: IDBSection[]
  locale: string
  timeZone: string
}): Array<ColumnDef<AssignmentMetaExtended>> {
  return [
    {
      id: 'startTime',
      meta: {
        name: 'Starttid',
        columnIcon: Clock3Icon,
        className: ''
      },
      accessorFn: ({ data }) => {
        return data.full_day ? undefined : data?.start || undefined
      },
      enableGrouping: true,
      enableSorting: true
    },
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: Briefcase,
        className: 'flex-1'
      },
      accessorFn: ({ title }) => title,
      cell: ({ row }) => {
        const assignmentTitle = row.getValue('title')
        const planningTitle = row.original?.planningTitle
        return <AssignmentTitles planningTitle={planningTitle} assignmentTitle={assignmentTitle as string} />
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
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => {
        return data.sectionId
      },
      cell: ({ row }) => {
        const sectionTitle = row.original.section
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
        className: 'box-content w-4 sm:w-8 pr-1 sm:pr-4'
      },
      accessorFn: ({ newsvalue }) => {
        return newsvalue
      },
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
      accessorFn: (data) => {
        const authors = data?.links?.filter((link) => link?.type === 'core/author') as AssigneeMeta[]
        return authors?.map((author: AssigneeMeta) => author?.title || author?.name)
      },
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
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: ({ data }) => {
        return [data?.start, data?.full_day, data?.publish_slot, data?.publish]
      },
      cell: ({ row }) => {
        const [start, fullDay, publishSlot, publishTime] = row.getValue<string[]>('assignment_time')
        const isFullday = fullDay === 'true'
        const types: string[] = row.getValue<DefaultValueOption[]>('assignmentType')?.map((t) => t.value)
        const formattedStart = dateInTimestampOrShortMonthDayTimestamp(start, locale, timeZone)

        /* Assignment type: text | video | graphic
          Order of returned information for non-picture assignments:
          1. publish_slot (Full day if true - otherwise daytime slot)
          2. publish time short (ex 13:30)
          3. start time short (ex 13:30)
        */

        if (!types.includes('picture')) {
          if (isFullday) {
            return <Time time='Heldag' type='fullday' />
          }
          if (publishSlot) {
            const slotFormatted = Object.entries(timesSlots).find((slot) => slot[1].slots.includes(+publishSlot))?.[1]?.label
            return <div>{slotFormatted}</div>
          }
          if (publishTime) {
            const formattedPublishTime = dateInTimestampOrShortMonthDayTimestamp(publishTime, locale, timeZone)
            return <Time time={formattedPublishTime} type='publish' tooltip='Publiceringstid' />
          }

          // Default to display the start time of the assignment
          return <Time time={formattedStart} type='start' tooltip='Uppdragets starttid' />
        }
        /* Assignment type: picture
           • Always display the shortened start time (ex 13:30)
        */
        return <Time time={formattedStart} type='start' tooltip='Uppdragets starttid' />
      },
      enableSorting: false,
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
          return (
            <div className='flex flex-row gap-2'>
              {items.map((item) => (
                <span key={item.value}>
                  {item.label}
                </span>
              ))}
            </div>
          )
        }
      },
      accessorFn: ({ meta }) => {
        return meta?.filter((metaType: MetaValueType) => metaType.type === 'core/assignment-type')
          .map((type) => type.value)
      },
      cell: ({ row }) => {
        const data = AssignmentTypes.filter(
          (assignmentType) => (row.getValue<string[]>('assignmentType') || []).includes(assignmentType.value)
        )
        if (data.length === 0) {
          return null
        }

        return <Type data={data} />
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
        const deliverableUuid = row.original?.links?.find((link) => link?.rel === 'deliverable')?.uuid || ''
        const planningId = row.original.id
        return <Actions deliverableUuids={[deliverableUuid]} planningId={planningId} />
      }
    }
  ]
}
