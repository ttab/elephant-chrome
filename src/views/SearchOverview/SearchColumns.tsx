import { Calendar1, Pen, Shapes } from '@ttab/elephant-ui/icons'
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

export type ColumnType<T> = Array<ColumnDef<T>>
type RowType<T> = { row: Row<T> }
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
    return [...planningListColumns({ sections, authors })]
  }

  if (type === 'events') {
    return [
      ...eventTableColumns({ locale, sections, organisers })
    ]
  }

  if (type === 'assignments') {
    return [
      ...assignmentColumns({ authors, locale, timeZone, sections })
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
