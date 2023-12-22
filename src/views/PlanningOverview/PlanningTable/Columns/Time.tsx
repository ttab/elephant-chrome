import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { TimeDisplay } from '../../../../components/DataItem/TimeDisplay'
import { getPublishTime } from '@/lib/getPublishTime'

export const time: ColumnDef<Planning> = {
  id: 'time',
  accessorFn: (data) => getPublishTime(data._source['document.meta.core_assignment.data.publish']),
  cell: ({ row }) => (
    <TimeDisplay date={row.getValue('time')} />
  )
}
