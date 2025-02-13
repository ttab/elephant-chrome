import { FacetedFilter } from '@/components/Commands/FacetedFilter'
import { SectionBadge } from '@/components/DataItem/SectionBadge'
import { Newsvalue } from '@/components/Table/Items/Newsvalue'

import { Title } from '@/components/Table/Items/Title'
import { NewsvalueMap } from '@/defaults/newsvalueMap'
import { Newsvalues } from '@/defaults/newsvalues'
import { type ColumnDef } from '@tanstack/react-table'
import { Pen, Shapes, SignalHigh } from '@ttab/elephant-ui/icons'
import { type IDBSection } from 'src/datastore/types'
import type { Wire } from '@/hooks/index/lib/wires'

export function wiresListColumns({ sections = [], locale = 'sv-SE' }: {
  sections?: IDBSection[]
  locale?: string
}): Array<ColumnDef<Wire>> {
  return [
    {
      id: 'modified',
      enableGrouping: true,
      meta: {
        name: 'Tid',
        columnIcon: SignalHigh,
        className: 'hidden',
        display: (value: string) => {
          const [hour, day] = value.split(' ')
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
      accessorFn: (data) => {
        const date = new Date(data.fields.modified.values[0])

        if (date.toDateString() === new Date().toDateString()) {
          return date.getHours()
        } else {
          return `${date.getHours()} ${date.toLocaleString(locale, { weekday: 'long', hourCycle: 'h23' })}`
        }
      },
      cell: () => {
        return undefined
      }
    },
    {
      id: 'modifiedMinutes',
      meta: {
        name: 'Utgiven',
        columnIcon: SignalHigh,
        className: 'flex-px-3'
      },
      accessorFn: (data) => {
        return data.fields.modified.values[0]
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('modifiedMinutes'))
        const isPressRelease = row.original.fields['document.meta.tt_wire.role']?.values[0] === 'pressrelease'

        return (
          <span
            className={`font-thin text-xs ${isPressRelease ? 'underline decoration-red-500' : ''}`}
          >
            {`${date.getHours()}.${date.getMinutes().toString().padStart(2, '0')}`}
          </span>
        )
      }
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
        className: 'flex-none hidden @3xl/view:[display:revert] px-3'
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
        value.includes(row.getValue(id))

    },
    {
      id: 'title',
      meta: {
        name: 'Slugg',
        columnIcon: Pen,
        className: 'flex-1 w-[200px]'
      },
      accessorFn: (data) => (data.fields['document.title'].values[0]),
      cell: ({ row }) => {
        const title = row.getValue('title')

        return <Title title={title as string} className='text-xs' />
      }
    },
    {
      id: 'role',
      accessorFn: (data) => (data.fields['document.meta.tt_wire.role'].values[0]),
      cell: () => undefined
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
        return data.fields['document.rel.section.uuid']?.values[0]
      },
      cell: ({ row }) => {
        const sectionTitle = row.original.fields['document.rel.section.title']?.values[0]
        return sectionTitle && <SectionBadge title={sectionTitle} color='bg-[#BD6E11]' />
      },
      filterFn: (row, id, value: string[]) =>
        value.includes(row.getValue(id))
    }
  ]
}
