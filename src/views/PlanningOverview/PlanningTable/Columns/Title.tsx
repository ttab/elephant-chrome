import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'

export const title: ColumnDef<Planning> = {
  id: 'title',
  accessorFn: (data) => data._source['document.title'][0],
  cell: ({ row }) => {
    const internal = row.original._source['document.meta.core_planning_item.data.public'][0] !== 'true'
    const slugline = row.original._source['document.meta.core_assignment.meta.tt_slugline.value']

    return (
      <div className='flex space-x-2 w-fit'>
        <StatusIndicator internal={internal} />

        <span className='max-w-[200px] md:max-w-[300px] lg:max-w-[700px] truncate font-medium'>
          {row.getValue('title')}
        </span>

        {!!slugline?.length && (
          <span className='hidden font-medium text-slate-500 lg:block'>{slugline[0]}</span>
        )}
      </div>
    )
  }
}
