import { type ColumnDef } from '@tanstack/react-table'
import { type Planning } from '../data/schema'
import { TimeDisplay } from '../../../../components/DataItem/TimeDisplay'
import { getPublishTime } from '@/lib/getPublishTime'
import { Clock } from '@ttab/elephant-ui/icons'

export const time: ColumnDef<Planning> = {
  id: 'time',
  meta: {
    filter: null,
    name: 'Time',
    columnIcon: Clock,
    className: 'box-content w-[120px] hidden @3xl/view:[display:revert]'
  },
  accessorFn: (data) => getPublishTime(data._source['document.meta.core_assignment.data.publish']),
  cell: ({ row }) => (
    <TimeDisplay date={row.getValue('time')} />
  )
}
