import { type ColumnValueOption } from '@/types'
import {
  CircleCheck,
  PieChart
} from '@ttab/elephant-ui/icons'


export const DocumentStatuses: ColumnValueOption[] = [
  {
    label: 'Published',
    value: 'published',
    icon: CircleCheck,
    iconProps: {
      fill: '#4675C8',
      color: '#ffffff',
      className: 'bg-[#4675C8] rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Draft',
    value: 'draft',
    icon: PieChart,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  }
]
