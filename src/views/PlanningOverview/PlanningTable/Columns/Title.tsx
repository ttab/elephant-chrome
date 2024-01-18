import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { StatusIndicator } from '@/components/DataItem/StatusIndicator'
import { Pen } from '@ttab/elephant-ui/icons'

export const title: ColumnDef<Planning> = {
  id: 'title',
  meta: {
    filter: null,
    name: 'Title',
    columnIcon: Pen,
    className: 'box-content truncate'
  },
  accessorFn: (data) => data._source['document.title'][0],
  cell: ({ row }) => {
    const internal = row.original._source['document.meta.core_planning_item.data.public'][0] !== 'true'
    const slugline = row.original._source['document.meta.core_assignment.meta.tt_slugline.value']

    return (
      <div className='flex space-x-2 justify-start'>
        <StatusIndicator internal={internal} />

        <span className='truncate font-medium'>
          {row.getValue('title')}
        </span>

        {!!slugline?.length && (
          <span className='hidden font-medium text-slate-500 lg:block'>{slugline[0]}</span>
        )}
      </div>
    )
  }
}
