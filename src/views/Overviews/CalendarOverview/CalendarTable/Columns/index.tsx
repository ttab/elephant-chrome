import { type ColumnDef } from '@tanstack/react-table'
import { type Calendar } from '../data/schema'
import { Newsvalue } from './Newsvalue'
import { Title } from './Title'
import { Sector } from './Sector'
import {
  SignalHigh,
  Pen,
  Shapes,
  Clock3Icon,
  Eye,
  Navigation,
  NotebookPen
} from '@ttab/elephant-ui/icons'
import { Newsvalues, NewsvalueMap, CalendarSectors, VisibilityStatuses } from '@/defaults'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { Time } from './Time'
import { Actions } from './Actions'
import { PlanningStatus } from './PlanningStatus'


export const columns: Array<ColumnDef<Calendar>> = [
  {
    id: 'visibilityStatus',
    meta: {
      filter: 'facet',
      options: VisibilityStatuses,
      name: 'Visibility',
      columnIcon: Eye,
      className: 'box-content w-6 pr-0'
    },
    accessorFn: (data) => data._source['document.meta.core_description.role'][0] !== 'public',
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
      options: CalendarSectors,
      filter: 'facet',
      name: 'Sector',
      columnIcon: Shapes,
      className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
    },
    accessorFn: (data) => data._source['document.rel.section.title']?.[0],
    cell: ({ row }) => {
      const title = row.getValue<string>('sector')
      return <Sector title={title || ''} />
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    }
  },
  {
    id: 'planning_status',
    meta: {
      filter: 'facet',
      name: 'Planning Status',
      columnIcon: NotebookPen,
      className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
    },
    accessorFn: (data) => data?._relatedPlannings,
    cell: ({ row }) => {
      const _status = row.getValue<string>('planning_status')
      return <PlanningStatus status={_status} />
    }
  },
  {
    id: 'event_time',
    meta: {
      filter: 'facet',
      name: 'Event Time',
      columnIcon: Clock3Icon,
      className: 'box-content w-[112px] hidden @5xl/view:[display:revert]'
    },
    accessorFn: (data) => {
      const startTime = new Date(data._source['document.meta.core_event.data.start'][0])
      const endTime = new Date(data._source['document.meta.core_event.data.end'][0])
      return [startTime, endTime]
    },
    cell: ({ row }) => {
      const startTime = row.getValue<Date[]>('event_time')[0] || undefined
      const endTime = row.getValue<Date[]>('event_time')[1] || undefined
      return <Time startTime={startTime} endTime={endTime} />
    }
  },
  {
    id: 'action',
    meta: {
      filter: null,
      name: 'Action',
      columnIcon: Navigation,
      className: 'box-content w-[32px] hover:bg-red-400'
    },
    cell: ({ row }) => {
      // What to use here for calendar posts? There is no such field for them.
      // const deliverableUuids = row.original._source['document.meta.core_assignment.rel.deliverable.uuid'] || []
      const eventId = row.original._id

      return <Actions deliverableUuids={['Vad visar vi här?']} eventId={eventId} />
    }
  }
]
