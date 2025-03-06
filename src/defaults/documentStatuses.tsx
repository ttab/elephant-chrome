import { type DefaultValueOption } from '@/types'
import {
  CircleCheck,
  CircleDot,
  CircleX,
  BadgeCheck
} from '@ttab/elephant-ui/icons'


export const DocumentStatuses: DefaultValueOption[] = [
  {
    label: 'Publicerad',
    actionLabel: 'Publicera',
    value: 'usable',
    icon: CircleCheck,
    iconProps: {
      color: '#ffffff',
      className: 'bg-usable fill-usable rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Tidsplanerad',
    actionLabel: 'Tidsplanera',
    value: 'withheld',
    icon: CircleCheck,
    iconProps: {
      color: '#ffffff',
      className: 'bg-withheld fill-withheld rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Klar',
    actionLabel: 'Klar!',
    value: 'done',
    icon: CircleCheck,
    iconProps: {
      color: '#ffffff',
      className: 'bg-done fill-done rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Godkänd',
    actionLabel: 'Godkänn',
    value: 'approved',
    icon: BadgeCheck,
    iconProps: {
      color: '#ffffff',
      className: 'bg-approved fill-approved rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Inställd',
    actionLabel: 'Ställ in',
    value: 'cancelled',
    icon: CircleX,
    iconProps: {
      color: '#ffffff',
      className: 'bg-cancelled fill-cancelled rounded-full',
      size: 18,
      strokeWidth: 1.75
    }
  },
  {
    label: 'Utkast',
    actionLabel: 'Utkast!',
    value: 'draft',
    icon: CircleDot,
    iconProps: {
      className: 'text-muted-foreground',
      size: 18,
      strokeWidth: 1.75
    }
  }
] as const
