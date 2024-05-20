import { type DefaultValueOption } from '@/types'
import {
  CircleCheck,
  PieChart
} from '@ttab/elephant-ui/icons'


export const DocumentStatuses: DefaultValueOption[] = [
  {
    label: 'Published',
    value: 'published',
    icon: CircleCheck,
    iconProps: {
      fill: '#86B0F9',
      color: '#ffffff',
      className: 'bg-[#86B0F9] rounded-full',
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
