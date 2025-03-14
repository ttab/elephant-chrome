import { type ColumnDef } from '@tanstack/react-table'
import { type Event } from '@/lib/index/schemas/event'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { type MouseEvent } from 'react'
import {
  SignalHigh,
  Pen,
  Shapes,
  Clock3Icon,
  Navigation,
  NotebookPen,
  Edit,
  Delete,
  CircleCheck,
  BookUser
} from '@ttab/elephant-ui/icons'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { DocumentStatuses, Newsvalues, NewsvalueMap } from '@/defaults'
import { Time } from '@/components/Table/Items/Time'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { Title } from '@/components/Table/Items/Title'
import { Status } from '@/components/Table/Items/Status'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBOrganiser, type IDBSection } from 'src/datastore/types'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { Tooltip } from '@ttab/elephant-ui'

export function eventTableColumns({ sections = [], organisers = [] }: {
  sections?: IDBSection[]
  organisers?: IDBOrganiser[]
}): Array<ColumnDef<Event>> {
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
        className: 'flex-none'
      },
      accessorFn: (data) => data?._source['document.meta.status'][0],
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        return <DocumentStatus type='core/event' status={status} />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
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
        className: 'flex-none hidden @3xl/view:[display:revert]'
      },
      accessorFn: (data) => data._source['document.meta.core_newsvalue.value']?.[0],
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
      id: 'title',
      meta: {
        name: 'Slugg',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => data._source['document.title'][0],
      cell: ({ row }) => {
        const slugline = row.original._source['document.meta.tt_slugline.value']?.[0]
        const title = row.getValue('title')

        return <Title title={title as string} slugline={slugline} />
      }
    },
    {
      id: 'organiser',
      meta: {
        options: organisers.map((o) => ({ label: o.title, value: o.title })),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Organisatör',
        columnIcon: BookUser,
        className: 'flex-none hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => data?._source['document.rel.organiser.title']?.[0],
      cell: ({ row }) => {
        const value: string = row.getValue('organiser') || ''

        if (value) {
          return (
            <Tooltip content={`Organisatör: ${value}`}>
              <div className='border-slate-200 rounded-md mr-2 p-1 truncate'>{value}</div>
            </Tooltip>
          )
        }
        return <></>
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id))
      }
    },
    {
      id: 'section',
      meta: {
        options: sections.map((_) => {
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
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => data._source['document.rel.section.uuid']?.[0],
      cell: ({ row }) => {
        const sectionTitle = row.original._source['document.rel.section.title']?.[0]
        return (
          <>
            {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
          </>
        )
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    {
      id: 'planning_status',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: [{ label: 'Planerad', value: 'planned' }, { label: 'Ej planerad', value: 'unplanned' }],
        name: 'Planeringsstatus',
        columnIcon: NotebookPen,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
      },
      accessorFn: (data) => Array.isArray(data?._relatedPlannings)
        ? 'planned'
        : 'unplanned',
      cell: ({ row }) => {
        const _status = row.original._relatedPlannings?.[0]
        return <Status status={_status} />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    // TODO: Use range filter
    {
      id: 'event_time',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        name: 'Tid',
        columnIcon: Clock3Icon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
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
        name: 'Action',
        columnIcon: Navigation,
        className: 'flex-none'
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
    item: (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
    }
  },
  {
    label: 'Ta bort',
    icon: Delete,
    item: (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      confirm('Ta bort')
    }
  }
]
