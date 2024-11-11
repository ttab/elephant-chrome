/* eslint-disable react/prop-types */
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { Newsvalues } from '@/defaults/newsvalues'
import { Calendar1Icon, CircleCheck, Pen, Shapes, SignalHigh } from '@ttab/elephant-ui/icons'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { documentTypeValueFormat } from '@/defaults/documentTypeFormats'
import { Title } from '@/components/Table/Items/Title'
import { isArticle, isEvent, isPlanning } from '@/lib/isType'
import { dateToReadableDateTime } from '@/lib/datetime'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { IDBSection } from 'src/datastore/types'
import { Badge, Tooltip } from '@ttab/elephant-ui'
import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '@/lib/index/schemas/planning'
import { type Article } from '@/lib/index'
import { type Event } from '@/lib/index'
import { type AssignmentMetaExtended } from '../Assignments/types'
import { AssignmentTitles } from '@/components/Table/Items/AssignmentTitles'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'

export function searchWideColumns({ locale, timeZone, sections }: {
  locale: string,
  timeZone: string,
  sections: IDBSection[]
}): Array<ColumnDef<Planning | Event | AssignmentMetaExtended | Article>> {
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
      accessorFn: (data) => {
        if ('_source' in data) {
          if (isPlanning(data)) {
            return data?._source['document.meta.status'][0]
          }
        }
      },
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        return <DocumentStatus status={status} />
      },
      filterFn: (row, id, value) => (
        value.includes(row.getValue(id))
      )
    },
    {
      id: 'newsvalue',
      enableGrouping: true,
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: Newsvalues,
        name: 'Nyhetsvärde',
        columnIcon: SignalHigh,
        className: 'flex-none hidden @3xl/view:[display:revert]'
      },
      accessorFn: (data) => {
        if ('_source' in data) {
          return data?._source['document.meta.core_newsvalue.value']?.[0]
        }
        // assignment type
        return data?.newsvalue
      },
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]

        if (newsvalue) {
          return <Newsvalue newsvalue={newsvalue} />
        }
        if (!newsvalue) {
          return (
            <Badge
              variant='outline'
              className='rounded-lg px-1 sm:px-2 py-1 bg-background w-5 sm:w-10 h-7'
            >
              <span className='text-muted-foreground text-sm font-sans font-normal'>-</span>
            </Badge>
          )
        }
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    },
    {
      id: 'itemType',
      accessorFn: (data) => {
        if ('_source' in data) {
          return data?._source['document.type'][0]
        }
        // assignment type
        return 'core/assignment'
      },
      cell: ({ row }) => {
        const value: string = row.getValue('itemType')

        if (value) {
          const type = documentTypeValueFormat[value]
          const TypeIcon = type.icon
          return (
            <Tooltip content={type.label }>
              <TypeIcon size={18} color={type.color} />
            </Tooltip>
          )
        }
        return <>Ingen dokumenttyp</>
      }
    },
    {
      id: 'title',
      meta: {
        name: 'Slugg',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => {
        if ('_source' in data) {
          return data?._source['document.title'][0]
        } else {
          return {
            planningTitle: data?.planningTitle,
            assignmentTitle: data?.title
          }
        }
      },
      cell: ({ row }) => {
        const title = row.getValue('title')
        if ('_source' in row?.original) {
          const slugline = row.original?._source['document.meta.tt_slugline.value']?.[0]
          return <Title title={title as string} slugline={slugline} />
        }
        // assignment type
        const data: { planningTitle: string, assignmentTitle: string } = row.getValue('title') || {}
        const { assignmentTitle, planningTitle } = data
        return <AssignmentTitles planningTitle={planningTitle} assignmentTitle={assignmentTitle} />
      }
    },
    {
      id: 'date',
      meta: {
        name: 'Datum',
        columnIcon: Calendar1Icon,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data: Planning | Event | AssignmentMetaExtended | Article) => {
        if ('_source' in data) {
          if (isPlanning(data)) {
            return data?._source['document.meta.core_planning_item.data.start_date'][0] as string
          }
          if (isEvent(data)) {
            return data?._source['document.meta.core_event.data.start'][0] as string
          }
          if (isArticle(data)) {
            return data?._source.created[0] as string
          }
        }
        // assignment type
        return data?.data?.publish
      },
      cell: ({ row }) => {
        const dateValue = row.getValue('date') as string
        if(dateValue) {
          const d = new Date(dateValue)
          const date = dateToReadableDateTime(d, locale, timeZone)
          return <div>{date}</div>
        }
        return <></>
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
        className: 'flex-none w-[115px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data) => {
        if ('_source' in data) {
          return data._source['document.rel.section.title']?.[0]
        }
        // assignment type
        return data?.section
      },
      cell: ({ row }) => {
        const sectionTitle = row.getValue('section') as string
        return <>
          {sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />}
        </>
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    },
  ]
}
