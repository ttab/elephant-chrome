import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { SectorBadge } from '@/components/DataItem/SectorBadge'

export const section: ColumnDef<Planning> = {
  id: 'section',
  accessorFn: (data) => data._source['document.rel.sector.title'][0],
  cell: ({ row }) => {
    return <SectorBadge value={row.original._source['document.rel.sector.title'][0]} />
  }
}
