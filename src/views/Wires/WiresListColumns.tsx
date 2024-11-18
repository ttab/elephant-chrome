
import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { Title } from '@/components/Table/Items/Title'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalues } from '@/defaults/newsvalues'
import { type Wire } from '@/lib/index/schemas/wire'
import { type ColumnDef } from '@tanstack/react-table'
import { Pen, Shapes, SignalHigh } from '@ttab/elephant-ui/icons'
import { type IDBSection } from 'src/datastore/types'

export function wiresListColumns({ sections = [] }: {
  sections?: IDBSection[]
}): Array<ColumnDef<Wire>> {
  return [
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
        name: 'Slugg',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => (data._source['document.title'][0]),
      cell: ({ row }) => {
        const title = row.getValue('title')

        return <Title title={title as string} />
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
      accessorFn: (data) => {
        return data._source['document.rel.section.uuid']?.[0]
      },
      cell: ({ row }) => {
        const sectionTitle = row.original._source['document.rel.section.title']?.[0]
        return sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      }
    }
  ]
}
