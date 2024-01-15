import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { Priority } from './Priority'
import { Title } from './Title'
import { Sector } from './Sector'
import { Assignees } from './Assignees'
import { Type } from './Type'
import { Time } from './Time'
import { Actions } from './Actions'
import { SignalHigh, Pen, Shapes, Users, Crosshair, Clock, Navigation } from '@ttab/elephant-ui/icons'
import { getPublishTime } from '@/lib/getPublishTime'
import { Priorities, Sectors, AssignmentTypes } from '@/defaults'

export const columns: Array<ColumnDef<Planning>> = [
  {
    id: 'priority',
    meta: {
      filter: 'facet',
      options: Priorities,
      name: 'Priority',
      columnIcon: SignalHigh
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
      columnIcon: Pen
    },
    accessorFn: (data) => data._source['document.title'][0],
    cell: ({ row }) => {
      const internal = row.original._source['document.meta.core_planning_item.data.public'][0] !== 'true'
      const slugline = row.original._source['document.meta.core_assignment.meta.tt_slugline.value']
      const title = row.getValue('title')

      return <Title title={title} internal={internal} slugline={slugline} />
    }
  },
  {

    id: 'sector',
    meta: {
      options: Sectors,
      filter: 'facet',
      name: 'Sector',
      columnIcon: Shapes
    },
    accessorFn: (data) => data._source['document.rel.sector.title'][0],
    cell: ({ row }) => {
      return <Sector section={row.original._source['document.rel.sector.title'][0]} />
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
      columnIcon: Users
    },
    accessorFn: (data) => data._source['document.meta.core_assignment.rel.assignee.name'],
    cell: ({ row }) => {
      const assignees = row.getValue<string[]>('assignees') || []
      return <Assignees assignees={assignees}/>
    }
  },
  {
    id: 'type',
    meta: {
      filter: 'facet',
      options: AssignmentTypes,
      name: 'Type',
      columnIcon: Crosshair
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
      columnIcon: Clock
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
      columnIcon: Navigation
    },
    cell: ({ row }) => {
      const deliverableUuids = row.original._source['document.meta.core_assignment.rel.deliverable.uuid'] || []
      return <Actions deliverableUuids={deliverableUuids} />
    }
  }
]

