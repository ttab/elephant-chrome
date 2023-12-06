import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { type Planning } from '../data/schema'
import { sectors } from '../data/settings'

export const section: ColumnDef<Planning> = {

  id: 'section',
  accessorFn: (data) => data._source['document.rel.sector.title'][0],
  cell: ({ row }) => {
    const sector = sectors.find((label) => label.value === row.original._source['document.rel.sector.title'][0])

    return sector && <Badge variant='outline'>
        <div className={cn('h-2 w-2 rounded-full mr-2', sector?.color) } />
        <span className='text-slate-500 font-medium font-sans'>{sector.label}</span>
      </Badge>
  }
}
