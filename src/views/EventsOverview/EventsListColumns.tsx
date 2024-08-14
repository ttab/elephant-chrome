import { type ColumnDef } from '@tanstack/react-table'
import { type Event } from '@/lib/index/schemas/event'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { type MouseEvent } from 'react'
import {
  SignalHigh,
  Pen,
  Shapes,
  Clock3Icon,
  Eye,
  Navigation,
  NotebookPen,
  Edit,
  Delete
} from '@ttab/elephant-ui/icons'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Newsvalues, NewsvalueMap, VisibilityStatuses } from '@/defaults'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { Time } from '@/components/Table/Items/Time'
import { Title } from '@/components/Table/Items/Title'
import { Status } from '@/components/Table/Items/Status'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBSection } from 'src/datastore/types'


export function eventTableColumns({ sections = [] }: {
  sections?: IDBSection[]
}): Array<ColumnDef<Event>> {
  return [
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
      id: 'section',
      meta: {
        options: sections.map(_ => {
          return {
            value: _.id,
            label: _.title
          }
        }),
        filter: 'facet',
        name: 'Section',
        columnIcon: Shapes,
        className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => data._source['document.rel.section.title']?.[0],
      cell: ({ row }) => {
        const sectionTitle = row.getValue<string | undefined>('section')
        return <>
          {sectionTitle && <SectionBadge label={sectionTitle} color='bg-[#BD6E11]' />}
        </>
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
        return <Status status={_status} />
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
        className: 'box-content w-[32px]'
      },
      cell: () => {
        return <DotDropdownMenu items={menuItems} />
      }
    }
  ]
}

const menuItems = [
  {
    label: 'Redigera',
    icon: Edit,
    item: <T extends HTMLElement>(event: MouseEvent<T>) => {
      event.preventDefault()
      event.stopPropagation()
    }
  },
  {
    label: 'Ta bort',
    icon: Delete,
    item: <T extends HTMLElement>(event: MouseEvent<T>) => {
      event.preventDefault()
      event.stopPropagation()
      confirm('Ta bort')
    }
  }
]
