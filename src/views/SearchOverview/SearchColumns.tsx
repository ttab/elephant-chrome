import { Calendar1, Clock3Icon, Pen, Shapes } from '@ttab/elephant-ui/icons'
import { dateToReadableShort } from '@/lib/datetime'
import { planningListColumns } from '../PlanningOverview/PlanningListColumns'
import { eventTableColumns } from '../EventsOverview/EventsListColumns'
import { assignmentColumns } from '../Assignments/AssignmentColumns'
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { isArticle } from '@/lib/isType'
import { Title } from '@/components/Table/Items/Title'
import type { IDBAuthor, IDBOrganiser, IDBSection } from 'src/datastore/types'
import type { Row, ColumnDef, Column } from '@tanstack/react-table'
import type { Planning } from '@/lib/index/schemas/planning'
import type { Article, Event } from '@/lib/index'
import type { AssignmentMetaExtended } from '../Assignments/types'
import type { LocaleData } from '@/types'
import type { Dispatch, SetStateAction } from 'react'
import { slotLabels } from '@/defaults/assignmentTimeslots'

type RowType<T> = { row: Row<T> }
export type ColumnType<T> = Array<ColumnDef<T>>
export type SearchColumnType = ColumnType<Planning> | ColumnType<Event> | ColumnType<AssignmentMetaExtended> | ColumnType<Article>

export function searchColumns({ locale, timeZone, sections, type, authors, organisers }: {
  locale: LocaleData
  timeZone: string
  sections: IDBSection[]
  authors?: IDBAuthor[]
  organisers?: IDBOrganiser[]
  type: 'plannings' | 'events' | 'assignments' | 'articles'
}): SearchColumnType {
  if (type === 'plannings') {
    const columns = planningListColumns({ sections, authors })
    const last = columns.pop() as ColumnDef<Planning>
    return [
      ...columns,
      {
        id: 'start_date',
        meta: {
          name: 'Datum',
          columnIcon: Calendar1,
          className: 'flex-none w-[100px]'
        },
        accessorFn: (data: Planning) => {
          const startTime = new Date(data?._source['document.meta.core_planning_item.data.start_date']?.[0])
          if (!startTime) {
            return ''
          }
          return startTime
        },
        cell: ({ row }: RowType<Planning>) => {
          const dateValue: string = row.getValue('start_date')
          if (dateValue) {
            const day = dateToReadableShort(new Date(dateValue), locale.code.full, timeZone)
            return <div>{day}</div>
          }
          return <></>
        }
      },
      last
    ]
  }

  if (type === 'events') {
    const columns = eventTableColumns({ locale, sections, organisers })
    const last = columns.pop() as ColumnDef<Event>

    return [
      ...columns,
      {
        id: 'start_date',
        meta: {
          name: 'Datum',
          columnIcon: Calendar1,
          className: 'flex-none w-[100px]'
        },
        accessorFn: (data: Event) => {
          const startTime = new Date(data?._source['document.meta.core_event.data.start']?.[0])
          return startTime
        },
        cell: ({ row }: RowType<Event>) => {
          const dateValue: string = row.getValue('start_date')
          if (dateValue) {
            const day = dateToReadableShort(new Date(dateValue), locale.code.full, timeZone)
            return <div>{day}</div>
          }
          return <></>
        }
      },
      last
    ]
  }

  if (type === 'assignments') {
    const columns = assignmentColumns({ authors, locale, timeZone, sections })
    const last = columns.pop() as ColumnDef<AssignmentMetaExtended>
    return [
      ...columns,
      {
        id: 'startDate',
        meta: {
          options: slotLabels,
          name: 'Uppdragstid',
          columnIcon: Clock3Icon,
          className: 'flex-none w-[112px] hidden @5xl/view:[display:revert]'
        },
        accessorFn: ({ data }: AssignmentMetaExtended) => [data?.start],
        cell: ({ row }: RowType<AssignmentMetaExtended>) => {
          const [start] = row.getValue<string[]>('assignment_time')
          const day = dateToReadableShort(new Date(start), locale.code.full, timeZone)
          return <div>{day}</div>
        }
      },
      last
    ]
  }

  if (type === 'articles') {
    return [
      {
        id: 'slugline',
        meta: {
          name: 'Slugg',
          columnIcon: Pen,
          className: 'flex-1 w-[200px]'
        },
        accessorFn: (data: Article) => {
          if ('_source' in data) {
            return data?._source['document.title'][0]
          }
        },
        cell: ({ row }: RowType<Article>) => {
          const title = row.getValue('slugline')
          if ('_source' in row.original) {
            const slugline = row.original?._source['document.meta.tt_slugline.value']?.[0]
            return <Title title={title as string} slugline={slugline} />
          }
        },
        enableGrouping: false
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
          Filter: ({ column, setSearch }: { column: Column<Article>, setSearch: Dispatch<SetStateAction<string | undefined>> }) => (
            <FacetedFilter column={column} setSearch={setSearch} />
          ),
          name: 'Sektion',
          columnIcon: Shapes,
          className: 'flex-none w-[135px] hidden @4xl/view:[display:revert]'
        },
        accessorFn: (data: Article) => {
          if ('_source' in data) {
            return data._source['document.rel.section.title']?.[0]
          }
        },
        cell: ({ row }: RowType<Article>) => {
          const sectionTitle = row.getValue('section')
          if (sectionTitle) {
            return <SectionBadge title={sectionTitle as string} color='bg-[#BD6E11]' />
          }
          return <></>
        }
      },
      {
        id: 'date',
        meta: {
          name: 'Datum',
          columnIcon: Calendar1,
          className: 'flex-none w-[100px]'
        },
        accessorFn: (data: Planning | Event | AssignmentMetaExtended | Article) => {
          if ('_source' in data) {
            if (isArticle(data)) {
              return data?._source['heads.usable.created'][0]
            }
          }
        },
        cell: ({ row }: RowType<Article>) => {
          const dateValue: string = row.getValue('date')
          if (dateValue) {
            const day = dateToReadableShort(new Date(dateValue), locale.code.full, timeZone)
            return <div>{day}</div>
          }
          return <></>
        }
      }
    ]
  }

  return []
}
