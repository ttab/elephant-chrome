/* eslint-disable react/prop-types */
import { type ColumnDef } from '@tanstack/react-table'
import { Title } from '@/components/Table/Items/Title'

import {
  CircleCheck,
  Clock3Icon,
  Crosshair,
  Users
} from '@ttab/elephant-ui/icons'
import { type Assignment } from '@/lib/index/schemas/assignment'
import { type IDBAuthor } from 'src/datastore/types'
import { getNestedFacetedUniqueValues } from '@/components/Filter/lib/getNestedFacetedUniqueValues'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { Assignees } from '@/components/Table/Items/Assignees'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'
import { Time } from '@/components/Table/Items/Time'

export function assignmentColumns({ authors }: {
  authors?: IDBAuthor[]
}): Array<ColumnDef<Assignment>> {
  return [
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: CircleCheck,
        className: 'box-content truncate'
      },
      accessorFn: (data) => {
        return data?._source['document.title'][0]
      },
      filterFn: (row, id, value) => value.some((x: string) => row.getValue<string[] | undefined>(id)?.includes(x)),
      cell: ({ row }) => {
        const title = row.getValue<string>('title')
        return <Title title={title} />
      }
    },
    {
      id: 'type',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        options: AssignmentTypes,
        name: 'Typ',
        columnIcon: Crosshair,
        className: 'box-content hidden w-[120px] @6xl/view:[display:revert]'
      },
      accessorFn: (data) => data._source['document.meta.core_assignment_type.value'],
      cell: ({ row }) => {
        const data = AssignmentTypes.filter(
          (assignmentType) => (row.getValue<string[]>('type') || []).includes(assignmentType.value)
        )
        if (data.length === 0) {
          return null
        }

        return <Type data={data} />
      },
      filterFn: (row, id, value) => (
        value.some((v: string) => row.getValue<string[] | undefined>(id)?.includes(v))
      )
    },
    {
      id: 'assignees',
      meta: {
        options: authors?.map((_) => ({ value: _.title, label: _.title })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} facetFn={() => getNestedFacetedUniqueValues(column)} />
        ),
        name: 'Uppdragstagare',
        columnIcon: Users,
        className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data._source['document.rel.assigned_to.title'],
      cell: ({ row }) => {
        const assignees = row.getValue<string[]>('assignees') || []
        return <Assignees assignees={assignees} />
      },
      filterFn: (row, id, value) => (
        typeof value?.[0] === 'string'
          ? (row.getValue<string[]>(id) || []).includes(value[0])
          : false
      )
    },
    {
      id: 'event_time',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Tid',
        columnIcon: Clock3Icon,
        className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => {
        const startTime = new Date(data._source['document.meta.core_assignment.data.start'][0])
        const endTime = new Date(data._source['document.meta.core_assignment.data.end'][0])
        return [startTime, endTime]
      },
      cell: ({ row }) => {
        const startTime = row.getValue<Date[]>('event_time')[0] || undefined
        const endTime = row.getValue<Date[]>('event_time')[1] || undefined
        return <Time startTime={startTime} endTime={endTime} />
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
    }
  ]
}
