import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { Shapes } from '@ttab/elephant-ui/icons'
import { type ColumnValueOption } from '@/types'

export const columnValueOptions: ColumnValueOption[] = [
  {
    value: 'Utrikes',
    label: 'Utrikes',
    color: 'bg-[#BD6E11]'
  },
  {
    value: 'Inrikes',
    label: 'Inrikes',
    color: 'bg-[#DA90E1]'
  },
  {
    value: 'Sport',
    label: 'Sport',
    color: 'bg-[#6CA8DF]'
  },
  {
    value: 'Kultur och nöje',
    label: 'Kultur & Nöje',
    color: 'bg-[#12E1D4]'
  },
  {
    value: 'Ekonomi',
    label: 'Ekonomi',
    color: 'bg-[#FFB9B9]'
  }
]

export const section: ColumnDef<Planning> = {
  id: 'section',
  meta: {
    options: columnValueOptions,
    filter: 'facet',
    name: 'Section',
    icon: Shapes
  },
  accessorFn: (data) => data._source['document.rel.sector.title'][0],
  cell: ({ row }) => {
    return <SectorBadge value={row.original._source['document.rel.sector.title'][0]} />
  },
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id))
  }
}
