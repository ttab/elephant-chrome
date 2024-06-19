import { type DefaultValueOption } from '@/types'
import {
  Globe,
  Building
} from '@ttab/elephant-ui/icons'


export const VisibilityStatuses: DefaultValueOption[] = [
  {
    label: 'Publik',
    value: 'public',
    icon: Globe,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Intern',
    value: 'internal',
    icon: Building,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  }
]
