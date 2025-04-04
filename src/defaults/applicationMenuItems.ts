import { Cable, BriefcaseBusiness, CalendarDaysIcon, CalendarPlus2, SearchIcon, ZapIcon, type LucideIcon, EarthIcon, UtilityPole, Boxes, Printer, Library, Library } from '@ttab/elephant-ui/icons'
import type { ViewProps, View } from '../types'

/**
 * Defines a menu item in the main application menu.
 *
 * If target is dialog it will open in a dialog, default is a default view.
 *
 * If target is sheet it will open in a Sheet
 *
 * The property inject suggests that if the users active view is of this type
 * we want this doucment injected into the view/dialog. This is useful when
 * we want to pick up suggestions to the user based on what the user have
 * is working on right now.
 */

export type MenuGroups = { name: string, items: ApplicationMenuItem[] }
interface ApplicationMenu {
  groups: MenuGroups[]
}
export interface ApplicationMenuItem {
  name: View
  label: string
  icon: LucideIcon
  target?: 'view' | 'dialog' | 'sheet'
  color?: string
  props?: ViewProps
}

export const applicationMenu: ApplicationMenu = {
  groups: [
    {
      name: 'views',
      items: [
        {
          name: 'Plannings',
          label: 'Planeringar',
          icon: CalendarDaysIcon,
          color: '#FF971E'
        },
        {
          name: 'Approvals',
          label: 'Dagen',
          icon: EarthIcon,
          color: '#5E9F5D'
        },
        {
          name: 'Events',
          label: 'Händelser',
          icon: CalendarPlus2,
          color: '#D802FD'
        },
        {
          name: 'Assignments',
          label: 'Uppdrag',
          icon: BriefcaseBusiness,
          color: '#006bb3'
        },
        {
          name: 'Wires',
          label: 'Telegram',
          icon: Cable,
          color: '#FF6347'
        },
        {
          name: 'Latest',
          label: 'Senast utgivet',
          icon: UtilityPole,
          color: '#996633',
          target: 'sheet'
        },
        {
          name: 'Factboxes',
          label: 'Faktarutor',
          icon: Boxes,
          color: '#99c5c4'
        },
        {
          name: 'PrintArticles',
          label: 'Print',
          icon: Library,
          color: '#006bb3'
        }
      ]
    },
    {
      name: 'actions',
      items: [
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
    }
  ]
}
