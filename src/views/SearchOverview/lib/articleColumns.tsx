import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'
import { DocumentStatus } from '@/components/Table/Items/DocumentStatus'
import { Title } from '@/components/Table/Items/Title'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalues } from '@/defaults/newsvalues'
import type { Article } from '@/shared/schemas/article'
import type { Column, ColumnDef } from '@tanstack/react-table'
import { DocumentStatuses } from '@/defaults/documentStatuses'
import { CircleCheckIcon, PenIcon, ShapesIcon, SignalHighIcon } from '@ttab/elephant-ui/icons'
import type { Dispatch, SetStateAction } from 'react'
import type { IDBSection } from 'src/datastore/types'
import type { TFunction } from 'i18next'

export function articleColumns({ sections = [] }: {
  sections?: IDBSection[]
}, t: TFunction): Array<ColumnDef<Article>> {
  return [
    {
      id: 'documentStatus',
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: DocumentStatuses,
        name: 'Status',
        columnIcon: CircleCheckIcon,
        className: 'flex-none',
        display: (value: string) => {
          const statusLabel = t?.(`core:labels.${value}`)

          return <span>{statusLabel}</span>
        }
      },
      accessorFn: (data) => data?.fields['document.meta.status']?.values[0],
      cell: ({ row }) => {
        const status = row.getValue<string>('documentStatus')
        return <DocumentStatus type='core/planning-item' status={status} />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id)),
      enableColumnFilter: true
    },
    {
      id: 'newsvalue',
      enableGrouping: true,
      enableSorting: true,
      meta: {
        Filter: ({ column, setSearch }) => (
          <FacetedFilter column={column} setSearch={setSearch} />
        ),
        options: Newsvalues,
        name: 'Nyhetsvärde',
        columnIcon: SignalHighIcon,
        className: 'flex-none hidden @3xl/view:[display:revert]'
      },
      accessorFn: (data) => data.fields['document.meta.core_newsvalue.value']?.values[0],
      cell: ({ row }) => {
        const value: string = row.getValue('newsvalue') || ''
        const newsvalue = NewsvalueMap[value]

        if (newsvalue) {
          return <Newsvalue newsvalue={newsvalue} />
        }
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id)),
      enableColumnFilter: true
    },
    {
      id: 'title',
      meta: {
        name: 'Titel',
        columnIcon: PenIcon,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => data.fields['document.title']?.values[0],
      cell: ({ row }) => {
        const slugline = row.original.fields['document.meta.tt_slugline.value']?.values[0]
        const title = row.getValue('title')

        return <Title title={title as string} slugline={slugline} />
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
        columnIcon: ShapesIcon,
        className: 'flex-none w-[135px] hidden @4xl/view:[display:revert]'
      },
      accessorFn: (data: Article) => data.fields['document.rel.section.title']?.values[0],
      cell: ({ row }) => {
        const sectionTitle = row.getValue('section')
        if (sectionTitle) {
          return <SectionBadge title={sectionTitle as string} color='bg-[#BD6E11]' />
        }
        return <></>
      }
    }
  ]
}
