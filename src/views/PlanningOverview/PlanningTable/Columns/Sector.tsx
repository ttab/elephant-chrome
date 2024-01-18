import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { SectorBadge } from '@/components/DataItem/SectorBadge'
import { Shapes } from '@ttab/elephant-ui/icons'
import { Sectors } from '@/defaults'

export const sector: ColumnDef<Planning> = {
  id: 'section',
  meta: {
    options: Sectors,
    filter: 'facet',
    name: 'Sector',
    columnIcon: Shapes,
    className: 'box-content w-[115px] hidden @4xl/view:[display:revert]'
  },
  accessorFn: (data) => data._source['document.rel.sector.title'][0],
  cell: ({ row }) => {
    return <SectorBadge value={row.original._source['document.rel.sector.title'][0]} />
  },
  filterFn: (row, id, value) => {
    return value.includes(row.getValue(id))
  }
}
