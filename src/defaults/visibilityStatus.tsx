import { type DefaultValueOption } from '@/types'
import {
  Globe,
  Building
} from '@ttab/elephant-ui/icons'

const iconProps = {
  className: 'text-muted-foreground',
  size: 18,
  strokeWidth: 1.75
}

export const VisibilityStatuses: DefaultValueOption[] = [
  {
    label: 'Public',
    value: 'public',
    icon: Globe,
    iconProps
  },
  {
    label: 'Internal',
    value: 'internal',
    icon: Building,
    iconProps
  }
]
