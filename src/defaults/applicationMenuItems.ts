import { CalendarDaysIcon, CalendarPlus2, ZapIcon, type LucideIcon } from '@ttab/elephant-ui/icons'
import { type View } from '../types'

export interface ApplicationMenuItem {
  name: View
  label: string
  icon: LucideIcon
  mode?: 'view' | 'dialog'
}

export const applicationMenuItems: ApplicationMenuItem[] = [
  {
    name: 'Plannings',
    label: 'Planeringar',
    icon: CalendarDaysIcon
  },
  {
    name: 'Events',
    label: 'Händelser',
    icon: CalendarPlus2
  },
  {
    name: 'Flash',
    label: 'Skapa flash',
    icon: ZapIcon,
    mode: 'dialog'
  }
]
