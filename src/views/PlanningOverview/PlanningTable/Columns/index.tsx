import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { Priority } from './Priority'
import { Title } from './Title'
import { Sector } from './Sector'
import { Assignees } from './Assignees'
import { Type } from './Type'
import { Time } from './Time'
import { Actions } from './Actions'
import {
  SignalHigh,
  Pen,
  Shapes,
  Users,
  Crosshair,
  Clock,
  Navigation,
  Eye
} from '@ttab/elephant-ui/icons'
import { getPublishTime } from '@/lib/getPublishTime'
import { Priorities, Sectors, AssignmentTypes, VisibilityStatuses } from '@/defaults'
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
    id: 'priority',
    meta: {
      filter: 'facet',
      options: Priorities,
      name: 'Priority',
      columnIcon: SignalHigh,
      className: 'box-content w-8 pr-4'
    },
    accessorFn: (data) => data._source['document.meta.core_planning_item.data.priority'][0],
    cell: ({ row }) => {
      const priority = Priorities.find(
        (priority) => {
          return priority.value === row.getValue('priority')
        }
      )
      if (!priority) {
        return null
      }

      return (<Priority priority={priority} />)
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
      const slugline = row.original._source['document.meta.core_assignment.meta.tt_slugline.value']?.[0]
      const title = row.getValue('title')

      return <Title title={title as string} slugline={slugline} />
    }
  },
  {
    id: 'sector',
    meta: {
      options: Sectors,
      filter: 'facet',
      name: 'Sector',
      columnIcon: Shapes,
      className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
    },
    accessorFn: (data) => data._source['document.rel.sector.title'][0],
    cell: ({ row }) => {
      const sector = row.getValue<string>('sector')
      return <Sector section={sector} />
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
        (assignmentType) => row.getValue<string[]>('type').includes(assignmentType.value)
      )
      if (data.length === 0) {
        return null
      }

      return <Type data={data} />
    },
    filterFn: 'arrIncludesSome'
  },
  {
    id: 'time',
    meta: {
      filter: null,
      name: 'Time',
      columnIcon: Clock,
      className: 'box-content w-[120px] hidden @3xl/view:[display:revert]'
    },
    accessorFn: (data) => getPublishTime(data._source['document.meta.core_assignment.data.publish']),
    cell: ({ row }) => (
      <Time date={row.getValue('time')} />
    )
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

