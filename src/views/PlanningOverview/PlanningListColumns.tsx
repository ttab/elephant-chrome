/* eslint-disable react/prop-types */
import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '@/lib/index/schemas/planning'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Title } from '@/components/Table/Items/Title'
import { Assignees } from '@/components/Table/Items/Assignees'
import { Type } from '@/components/Table/Items/Type'
import { Actions } from '@/components/Table/Items/Actions'
import {
  SignalHigh,
  Pen,
  Shapes,
  Users,
  Crosshair,
  Navigation,
  Eye,
  CircleCheck
} from '@ttab/elephant-ui/icons'
import { Newsvalues, NewsvalueMap, AssignmentTypes, VisibilityStatuses, DocumentStatuses } from '@/defaults'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBSection } from 'src/datastore/types'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'

export function planningTableColumns({ sections = [] }: {
  sections?: IDBSection[]
}): Array<ColumnDef<Planning>> {
  return [
    {
      id: 'documentStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: DocumentStatuses,
        name: 'Status',
        columnIcon: CircleCheck,
        className: 'box-content w-6 pr-0'
      },
      accessorFn: (data) => data?._source['document.meta.status'][0],
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        return <DocumentStatus status={status} />
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
    },
    {
      id: 'visibilityStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: VisibilityStatuses,
        name: 'Synlighet',
        columnIcon: Eye,
        className: 'box-content w-6 pr-0'
      },
      accessorFn: (data) => (
        data._source['document.meta.core_planning_item.data.public'][0] === 'true'
          ? 'public'
          : 'internal'
      ),
      cell: ({ row }) => {
        const visibility = row.getValue<'internal' | 'public'>('visibilityStatus')
        return <StatusIndicator visibility={visibility} />
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
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
        name: 'Slugg',
        columnIcon: Pen,
        className: 'box-content truncate'
      },
      accessorFn: (data) => data._source['document.title'][0],
      cell: ({ row }) => {
        const slugline = row.original._source['document.meta.tt_slugline.value']?.[0]
        const title = row.getValue('title')

        return <Title title={title as string} slugline={slugline} />
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
        const uuid = data._source['document.rel.sector.uuid']?.[0]
        const title = data._source['document.rel.sector.title']?.[0]
        return (uuid && title) ? { uuid, title } : undefined
      },
      cell: ({ row }) => {
        const section = row.getValue<{ uuid: string, title: string } | undefined>('section')
        return <>
          {section && <SectionBadge label={section.title} color='bg-[#BD6E11]' />}
        </>
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    },
    {
      id: 'assignees',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Uppdragstagare',
        columnIcon: Users,
        className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
      cell: ({ row }) => {
        const assignees = row.getValue<string[]>('assignees') || []
        return <Assignees assignees={assignees} />
      }
    },
    {
      id: 'type',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: AssignmentTypes,
        name: 'Typ',
        columnIcon: Crosshair,
        className: 'box-content w-[120px] hidden @6xl/view:[display:revert]'
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
      filterFn: 'arrIncludesSome'
    },
    {
      id: 'action',
      meta: {
        name: 'Action',
        columnIcon: Navigation,
        className: 'box-content w-[32px]'
      },
      cell: ({ row }) => {
        const deliverableUuids = row.original._source['document.meta.core_assignment.rel.deliverable.uuid'] || []
        const planningId = row.original._id

        return <Actions deliverableUuids={deliverableUuids} planningId={planningId} />
      }
    }
  ]
}
