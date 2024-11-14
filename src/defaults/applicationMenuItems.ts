import { BriefcaseBusiness, CalendarDaysIcon, CalendarPlus2, SearchIcon, ZapIcon, type LucideIcon } from '@ttab/elephant-ui/icons'
import { type View } from '../types'

/**
 * Defines a menu item in the main application menu.
 *
 * If target is dialog it will open in a dialog, default is a default view.
 *
 * The property inject suggests that if the users active view is of this type
 * we want this doucment injected into the view/dialog. This is useful when
 * we want to pick up suggestions to the user based on what the user have
 * is working on right now.
 */
export interface ApplicationMenuItem {
  name: View
  label: string
  icon: LucideIcon
  target?: 'view' | 'dialog'
  color?: string
}

export const applicationMenuItems: ApplicationMenuItem[] = [
  {
    name: 'Plannings',
    label: 'Planeringar',
    icon: CalendarDaysIcon,
    color: '#FF971E'
  },
  {
    name: 'Events',
    label: 'Händelser',
    icon: CalendarPlus2,
    color: '#5E9F5D'
  },
  {
    name: 'Assignments',
    label: 'Uppdrag',
    icon: BriefcaseBusiness,
    color: '#006bb3'
  },
  {
    name: 'Flash',
    label: 'Skapa flash',
    icon: ZapIcon,
    color: '#FF5150',
    target: 'dialog'
  },
  {
    name: 'Search',
    label: 'Sök',
    icon: SearchIcon,
    color: '#F06F21'
  }
]
