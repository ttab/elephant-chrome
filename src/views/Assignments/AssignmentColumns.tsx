/* eslint-disable react/prop-types */
import { type ColumnDef } from '@tanstack/react-table'
import { Title } from '@/components/Table/Items/Title'

import {
  CircleCheck,
  Crosshair,
  Shapes,
  SignalHigh,
  Users
} from '@ttab/elephant-ui/icons'
import { type Planning } from '@/lib/index/schemas/planning'
import { type IDBSection, type IDBAuthor } from 'src/datastore/types'
import { getNestedFacetedUniqueValues } from '@/components/Filter/lib/getNestedFacetedUniqueValues'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { Assignees } from '@/components/Table/Items/Assignees'
import { AssignmentTypes } from '@/defaults/assignmentTypes'
import { Type } from '@/components/Table/Items/Type'
// import { Time } from '@/components/Table/Items/Time'
import { Newsvalues } from '@/defaults/newsvalues'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { SectionBadge } from '@/components/DataItem/SectionBadge'

export function assignmentColumns({ authors = [], sections = [] }: {
  authors?: IDBAuthor[]
  sections?: IDBSection[]
}): Array<ColumnDef<Planning>> {
  return [
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
      accessorFn: (data) => data._source['document.meta.core_newsvalue.value']?.[0],
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
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: CircleCheck,
        className: 'box-content truncate'
      },
      accessorFn: (data) => {
        const docTitle = data?._source['document.title'][0]
        const assignmentTitle = data?._source['document.meta.core_assignment.title'][0]
        return `${docTitle}${docTitle ? ', ' + assignmentTitle : assignmentTitle}`
      },
      cell: ({ row }) => {
        const title = row.getValue<string>('title')
        const slugline = row.original._source['document.meta.tt_slugline.value']?.[0]
        return <Title title={title} slugline={slugline} />
      }
    },
    {
      id: 'section',
      meta: {
        options: sections.map(_ => {
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
        className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => {
        return data._source['document.rel.section.uuid']?.[0]
      },
      cell: ({ row }) => {
        const sectionTitle = row.original._source['document.rel.section.title']?.[0]
        return <>
          {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
        </>
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
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
      accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
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
      accessorFn: (data) => data._source['document.meta.core_assignment.meta.core_assignment_type.value'],
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
    }
    // {
    //   id: 'assignment_time',
    //   meta: {
    //     Filter: ({ column, setSearch }) => (
    //       <FacetedFilter column={column} setSearch={setSearch} />
    //     ),
    //     name: 'Tid',
    //     columnIcon: Clock3Icon,
    //     className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
    //   },
    //   accessorFn: (data) => {
    //     const startTime = new Date(data._source['document.meta.core_assignment.data.start'][0] ?? '')
    //     const endTime = new Date(data._source['document.meta.core_assignment.data.end'][0] ?? '')
    //     return [startTime, endTime]
    //   },
    //   cell: ({ row }) => {
    //     const startTime = row.getValue<Date[]>('assignment_time')[0] || undefined
    //     // const endTime = row.getValue<Date[]>('assignment_time')[1] || undefined
    //     return <Time startTime={startTime} />
    //   }
    // }
  ]
}
