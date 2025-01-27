
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Briefcase, Clock3Icon, Clock9Icon, Crosshair, Navigation, SignalHigh, Users } from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults/newsvalues'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'
import { getNestedFacetedUniqueValues } from '@/components/TableFilter/lib/getNestedFacetedUniqueValues'
import { Assignees } from '@/components/Table/Items/Assignees'
import { AssignmentTitles } from '@/components/Table/Items/AssignmentTitles'
import { Actions } from '@/components/Table/Items/Actions'
import { Tooltip } from '@ttab/elephant-ui'
import { dateInTimestampOrShortMonthDayTimestamp } from '@/lib/datetime'
import { type ColumnDef } from '@tanstack/react-table'
import { type DefaultValueOption } from '@/types/index'
import { type IDBAuthor } from 'src/datastore/types'
import {
  type MetaValueType,
  type AssignmentMeta,
  type AssigneeMeta
} from './types'
import { slotLabels, timesSlots } from '@/defaults/assignmentTimeslots'

export function assignmentColumns({ authors = [], locale, timeZone }: {
  authors?: IDBAuthor[]
  locale: string
  timeZone: string
}): Array<ColumnDef<AssignmentMeta & { planningTitle: string, newsvalue: string, _id: string }>> {
  return [
    {
      id: 'titles',
      meta: {
        name: 'Titlar',
        columnIcon: Briefcase,
        className: 'flex-1'
      },
      accessorFn: ({ planningTitle, title: assignmentTitle }) => {
        return {
          planningTitle,
          assignmentTitle
        }
      },
      cell: ({ row }) => {
        const data: { planningTitle: string, assignmentTitle: string } = row.getValue('titles') || {}
        const { assignmentTitle, planningTitle } = data
        return <AssignmentTitles planningTitle={planningTitle} assignmentTitle={assignmentTitle} />
      }
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
      }
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
        const start = data?.start
        const end = data?.end
        const hour = new Date(start).getHours()
        const slotEntries = Object.entries(timesSlots)
        const slotName: (string | undefined) = slotEntries.find(([_, s]): boolean => s.slots.includes(hour))?.[0]
        const slot = slotName ? timesSlots[slotName].label : 'Heldag'
        return [start, end, data?.full_day, slot]
      },
      cell: ({ row }) => {
        const [start, end, fullday, slot] = row.getValue<string[]>('assignment_time') || undefined
        const isFullday = fullday === 'true'
        const types: string[] = row.getValue<DefaultValueOption[]>('assignmentType')?.map((t) => t.value)
        const formattedStart = dateInTimestampOrShortMonthDayTimestamp(start, locale, timeZone)
        const formattedEnd = dateInTimestampOrShortMonthDayTimestamp(end, locale, timeZone)
        const formattedDatestring = `${formattedStart} - ${formattedEnd}`

        if (!types.includes('picture')) {
          if (isFullday) {
            return (
              <Tooltip content='Uppdragstid'>
                <div>Heldag</div>
              </Tooltip>
            )
          } else {
            return (
              <Tooltip content={`Uppdragstid: ${formattedDatestring}`}>
                <div>{slot}</div>
              </Tooltip>
            )
          }
        }
        /* Assignment type: picture */
        if (isFullday) {
          return (
            <Tooltip content='Uppdragstid'>
              <div>Heldag</div>
            </Tooltip>
          )
        } else {
          return (
            <Tooltip content={`Uppdragstid: ${formattedDatestring}`}>
              <div>{slot}</div>
            </Tooltip>
          )
        }
      },
      filterFn: (row, id, value: string[]) => {
        const val = row.getValue<string[]>(id) || undefined
        if (val) {
          return val.includes(timesSlots[value[0]]?.label)
        }
        return false
      }
    },
    {
      id: 'publish_time',
      meta: {
        options: slotLabels,
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Publiceringstid',
        columnIcon: Clock9Icon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: ({ data }) => {
        return [data?.publish]
      },
      cell: ({ row }) => {
        const [publishValue] = row.getValue<Array<string | undefined>>('publish_time') || undefined
        if (publishValue) {
          const publishTime = dateInTimestampOrShortMonthDayTimestamp(publishValue, locale, timeZone)
          return <Tooltip content='Publiceringstid'>{publishTime}</Tooltip>
        }
        return <></>
      },
      filterFn: (row, id, value: string[]) => {
        const val = row.getValue<Date>('publish_time') || undefined
        if (val) {
          return value.includes(row.getValue(id))
        }

        return false
      }
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
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4'
      },
      accessorFn: ({ meta }) => {
        const assignmentTypes = meta?.filter((metaType: MetaValueType) => metaType.type === 'core/assignment-type')
        return assignmentTypes?.map((type) => AssignmentTypes.find((aType) => aType.value === type?.value))
      },
      cell: ({ row }) => {
        const values: DefaultValueOption[] = row.getValue('assignmentType')
        return <Type data={values} />
      },
      filterFn: (row, id, value: string[]) => {
        const types = row.getValue<Array<{ value: string }> | undefined>(id)?.map((type) => type.value)
        return (
          value.some((v: string) => types?.includes(v))
        )
      }
    },
    {
      id: 'action',
      meta: {
        name: 'Action',
        columnIcon: Navigation,
        className: 'flex-none'
      },
      cell: ({ row }) => {
        const deliverableUuid = row.original?.links?.find((link) => link?.rel === 'deliverable')?.uuid || ''
        const planningId = row.original.id
        return <Actions deliverableUuids={[deliverableUuid]} planningId={planningId} />
      }
    }
  ]
}
