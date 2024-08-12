import { type DefaultValueOption } from '@/types'
import {
  CircleCheck,
  CircleDot,
  CircleX,
  BadgeCheck
} from '@ttab/elephant-ui/icons'


export const DocumentStatuses: DefaultValueOption[] = [
  {
    label: 'Publicerat',
    value: 'usable',
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
    label: 'Färdig',
    value: 'done',
    icon: CircleCheck,
    iconProps: {
      fill: '#5E9F5D',
      color: '#ffffff',
      className: 'bg-[#5E9F5D] rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Godkänd',
    value: 'approved',
    icon: BadgeCheck,
    iconProps: {
      fill: '#5D7CA2',
      color: '#ffffff',
      className: 'bg-[#5D7CA2] rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Inställd',
    value: 'withheld',
    icon: CircleX,
    iconProps: {
      fill: '#E12430',
      color: '#ffffff',
      className: 'bg-[#E12430] rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Utkast',
    value: 'draft',
    icon: CircleDot,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  }
]
