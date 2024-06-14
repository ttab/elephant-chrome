import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { Newsvalue } from './Newsvalue'
import { Title } from './Title'
import { Sector } from './Sector'
import { Assignees } from './Assignees'
import { Type } from './Type'
import { Actions } from './Actions'
import {
  SignalHigh,
  Pen,
  Shapes,
  Users,
  Crosshair,
  Navigation,
  Eye
} from '@ttab/elephant-ui/icons'
import { Newsvalues, NewsvalueMap, PlanningSectors, AssignmentTypes, VisibilityStatuses } from '@/defaults'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'


export const columns: Array<ColumnDef<Planning>> = [
  {
    id: 'visibilityStatus',
    meta: {
      filter: 'facet',
      options: VisibilityStatuses,
      name: 'Visibility',
      columnIcon: Eye,
      className: 'box-content w-6 pr-0'
    },
    accessorFn: (data) => data._source['document.meta.core_planning_item.data.public'][0] !== 'true',
    cell: ({ row }) => {
      const internal = row.getValue<boolean>('visibilityStatus')
      return <StatusIndicator internal={internal} />
    }
  },
  {
    id: 'newsvalue',
    meta: {
      filter: 'facet',
      options: Newsvalues,
      name: 'Priority',
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
      filter: null,
      name: 'Title',
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
    id: 'sector',
    meta: {
      options: PlanningSectors,
      filter: 'facet',
      name: 'Sector',
      columnIcon: Shapes,
      className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
    },
    accessorFn: (data) => data._source['document.rel.sector.uuid']?.[0],
    cell: ({ row }) => {
      const uuid = row.getValue<string>('sector')
      return <Sector uuid={uuid || ''} />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  },
  {
    id: 'assignees',
    meta: {
      filter: 'facet',
      name: 'Assignees',
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
      filter: 'facet',
      options: AssignmentTypes,
      name: 'Type',
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
      filter: null,
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
