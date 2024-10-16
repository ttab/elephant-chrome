/* eslint-disable react/prop-types */
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Briefcase, Clock3Icon, Clock9Icon, Crosshair, Navigation, SignalHigh, Users } from '@ttab/elephant-ui/icons'
import { Newsvalues } from '@/defaults/newsvalues'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'
import { getNestedFacetedUniqueValues } from '@/components/Filter/lib/getNestedFacetedUniqueValues'
import { Assignees } from '@/components/Table/Items/Assignees'
import { AssignmentTitles } from '@/components/Table/Items/AssignmentTitles'
import { Time } from '@/components/Table/Items/Time'
import { Actions } from '@/components/Table/Items/Actions'
import { Tooltip } from '@ttab/elephant-ui'
import { dateToReadableDateTime } from '@/lib/datetime'
import { type ColumnDef } from '@tanstack/react-table'
import { type DefaultValueOption } from '@/types/index'
import { type IDBAuthor } from 'src/datastore/types'
import {
  type MetaValueType,
  type AssignmentMeta,
  type AssigneeMeta,
  type AssignmentDateDetails
} from './types'


export function assignmentColumns({ authors = [], locale, timeZone }: {
  authors?: IDBAuthor[]
  locale: string
  timeZone: string
}): Array<ColumnDef<AssignmentMeta & { planningTitle: string, newsvalue: string }>> {
  return [
    {
      id: 'assignmentType',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        options: AssignmentTypes,
        name: 'Uppdragstyp',
        columnIcon: Crosshair,
        className: 'box-content w-8 sm:w-8 pr-1 sm:pr-4'
      },
      accessorFn: (data) => {
        const assignmentTypes = data?.meta?.filter((metaType: MetaValueType) => metaType.type === 'core/assignment-type')
        return assignmentTypes?.map(type => {
          return AssignmentTypes.find(aType => {
            return aType.value === type.value && type.value
          })
        })
      },
      cell: ({ row }) => {
        const values: DefaultValueOption[] = row.getValue('assignmentType')
        return <Type data={values} />
      },
      filterFn: (row, id, value) => {
        const types = row.getValue<Array<{ value: string }> | undefined>(id)?.map((type) => type.value)
        return (
          value.some((v: string) => types?.includes(v))
        )
      }
    },
    {
      id: 'titles',
      meta: {
        name: 'Titlar',
        columnIcon: Briefcase,
        className: 'flex-1'
      },
      accessorFn: (data) => {
        const { planningTitle, title: assignmentTitle } = data
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
      accessorFn: (data) => {
        return data.newsvalue
      },
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]

        if (newsvalue) {
          return <Newsvalue newsvalue={newsvalue} />
        }
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    },
    {
      id: 'assignees',
      meta: {
        options: authors.map((_) => ({ value: _.name, label: _.name })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        name: 'Uppdragstagare',
        columnIcon: Users,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => {
        const authors = data?.links?.filter(link => link?.type === 'core/author') as AssigneeMeta[]
        return authors?.map((author: AssigneeMeta) => author?.title || author?.name)
      },
      cell: ({ row }) => {
        const assignees = row.getValue<string[]>('assignees') || []
        return <Assignees assignees={assignees} />
      },
      filterFn: (row, id, value) => {
        const assignees = row.getValue<string[]>(id) || [] as string[]
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
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Uppdragstid',
        columnIcon: Clock3Icon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: ({ data }: { data: AssignmentDateDetails }) => {
        const startTime = new Date(data?.start)
        const endTime = new Date(data?.end)
        return [startTime, endTime]
      },
      cell: ({ row }) => {
        const [startTime, endTime] = row.getValue<Date[]>('assignment_time') || undefined
        return (
          <Tooltip content='Uppdragstid'>
            <Time startTime={startTime} endTime={endTime} />
          </Tooltip>
        )
      }
    },
    {
      id: 'publish_time',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Publiceringstid',
        columnIcon: Clock9Icon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: ({ data }: { data: AssignmentDateDetails }) => {
        if (data?.publish) {
          const date = new Date(data?.publish)
          const publishTime = dateToReadableDateTime(date, locale, timeZone)
          return <Tooltip content='Publiceringstid'>{publishTime}</Tooltip>
        }
        return <></>
      },
      cell: ({ row }) => {
        return row.getValue<Date[]>('publish_time') || undefined
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
        const deliverableUuid = row.original?.links?.find(link => link?.rel === 'deliverable')?.uuid || ''
        const planningId = row.original.id
        return <Actions deliverableUuids={[deliverableUuid]} planningId={planningId} />
      }
    }
  ]
}
