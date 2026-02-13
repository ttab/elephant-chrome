import { type ColumnDef } from '@tanstack/react-table'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { type MouseEvent } from 'react'
import {
  SignalHighIcon,
  PenIcon,
  ShapesIcon,
  Clock3Icon,
  NavigationIcon,
  EditIcon,
  DeleteIcon,
  CircleCheckIcon,
  BookUserIcon
} from '@ttab/elephant-ui/icons'
import type { DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { DotDropdownMenu } from '@/components/ui/DotMenu'
import { Newsvalues, NewsvalueMap, PlanningEventStatuses } from '@/defaults'
import { Time } from '@/components/Table/Items/Time'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { Title } from '@/components/Table/Items/Title'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { type IDBOrganiser, type IDBSection } from 'src/datastore/types'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { Tooltip } from '@ttab/elephant-ui'
import type { LocaleData } from '@/types/index'
import { getStatusFromMeta } from '@/lib/getStatusFromMeta'
import type { PreprocessedEventData } from './preprocessor'

export function eventTableColumns({ sections = [], organisers = [], locale }: {
  sections?: IDBSection[]
  organisers?: IDBOrganiser[]
  locale: LocaleData
}): Array<ColumnDef<PreprocessedEventData>> {
  // Memoize mapped options to prevent recreating on every render
  const sectionOptions = sections.map((_) => ({
    value: _.id,
    label: _.title
  }))

  const organiserOptions = organisers.map((o) => ({
    label: o.title,
    value: o.title
  }))

  return [
    {
      id: 'startTime',
      meta: {
        name: 'Starttid',
        columnIcon: SignalHighIcon,
        className: 'hidden',
        display: (value: string) => {
          const [hour, day] = value.split(' ')
          if (hour === 'undefined') {
            return <span>Heldag</span>
          }

          return (
            <div className='flex gap-3'>
              <span className='inline-flex items-center justify-center size-5 bg-background rounded-full ring-1 ring-gray-300'>
                {hour}
              </span>
              <span>{day}</span>
            </div>
          )
        }
      },
      accessorFn: (data: PreprocessedEventData) => {
        const startTime = data._preprocessed?.eventStart
        const endTime = data._preprocessed?.eventEnd

        if (!startTime || !endTime) {
          return 'N/A'
        }

        const start = new Date(startTime)
        const end = new Date(endTime)
        const isFullDay = (end.getTime() - start.getTime()) / (1000 * 60 * 60) > 12

        if (isFullDay) {
          return 'Heldag'
        }

        return `${start.getHours()} ${start.toLocaleString(locale.code.full, { weekday: 'long', hourCycle: 'h23' })}`
      }
    },
    {
      id: 'documentStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: PlanningEventStatuses,
        name: 'Status',
        columnIcon: CircleCheckIcon,
        className: 'flex-none',
        display: (value: string) => (
          <span>
            {PlanningEventStatuses.find((status) => status.value === value)?.label}
          </span>
        )
      },
      accessorFn: (data) => {
        if (!data.meta) {
          return 'draft'
        }

        return getStatusFromMeta(data.meta, false).name
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        return status ? <DocumentStatus type='core/event' status={status} /> : <></>
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id))
    },
    {
      id: 'newsvalue',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: Newsvalues,
        name: 'Nyhetsvärde',
        columnIcon: SignalHighIcon,
        className: 'flex-none hidden @3xl/view:[display:revert]'
      },
      accessorFn: (data: PreprocessedEventData) => data._preprocessed?.newsvalue,
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]
        return newsvalue ? <Newsvalue newsvalue={newsvalue} /> : <></>
      },
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id))
    },
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: PenIcon,
        className: 'flex-1 w-[200px]',
        display: (value: string) => (
          <span>
            {sections
              .find((section) => section.id === value)?.title}
          </span>
        )
      },
      accessorFn: (data) => data.document?.title,
      cell: ({ row }) => {
        const title = row.getValue('title')
        const cancelled = row.original._preprocessed?.cancelled
        return <Title title={title as string} cancelled={!!cancelled} />
      },
      enableGrouping: false
    },
    {
      id: 'organiser',
      meta: {
        name: 'Organisatör',
        columnIcon: BookUserIcon,
        className: 'flex-none hidden @4xl/view:[display:revert]',
        options: organiserOptions,
        display: (value: string) => (
          <span>
            {value === 'undefined' ? 'saknas' : value}
          </span>
        ),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        )
      },
      accessorFn: (data: PreprocessedEventData) => data._preprocessed?.organiserTitle,
      cell: ({ row }) => {
        const value: string = row?.getValue('organiser') || ''

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
        options: sectionOptions,
        name: 'Sektion',
        columnIcon: ShapesIcon,
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]',
        display: (value: string) => (
          <span>
            {sections
              .find((section) => section.id === value)?.title}
          </span>
        ),
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        quickFilter: true
      },
      accessorFn: (data: PreprocessedEventData) => data._preprocessed?.sectionUuid,
      cell: ({ row }) => {
        const sectionTitle = row.original._preprocessed?.sectionTitle
        return <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    },
    // TODO: Use range filter
    {
      id: 'event_time',
      meta: {
        name: 'Tid',
        columnIcon: Clock3Icon,
        className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]',
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        )
      },
      accessorFn: (data: PreprocessedEventData) => {
        return [data._preprocessed?.eventStart, data._preprocessed?.eventEnd]
      },
      cell: ({ row }) => {
        const [startTime, endTime] = row.getValue<(string | undefined)[]>('event_time')

        if (!startTime || !endTime) {
          return <></>
        }

        return <Time startTime={startTime} endTime={endTime} />
      },
      enableGrouping: false
    },
    {
      id: 'action',
      meta: {
        name: 'Action',
        columnIcon: NavigationIcon,
        className: 'flex-none'
      },
      accessorFn: (data) => data,
      cell: () => {
        return <DotDropdownMenu items={menuItems} />
      }
    }
  ]
}

const menuItems: DotDropdownMenuActionItem[] = [
  {
    label: 'Redigera',
    icon: EditIcon,
    item: (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
    }
  },
  {
    label: 'Ta bort',
    icon: DeleteIcon,
    item: (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      confirm('Ta bort')
    }
  }
]
