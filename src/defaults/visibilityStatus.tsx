import { type ColumnValueOption } from '@/types'
import {
  Globe,
  Building
} from '@ttab/elephant-ui/icons'


export const VisibilityStatuses: ColumnValueOption[] = [
  {
    label: 'Public',
    value: 'public',
    icon: Globe,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Internal',
    value: 'internal',
    icon: Building,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  }
]
