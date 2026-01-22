import {
  CableIcon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CalendarPlus2Icon,
  SearchIcon,
  ZapIcon,
  EarthIcon,
  UtilityPoleIcon,
  BoxesIcon,
  LibraryIcon,
  type LucideIcon
} from '@ttab/elephant-ui/icons'
import type { ViewProps, View } from '../types'
import i18next from 'i18next'

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
          label: i18next.t('app.mainMenu.plans'),
          icon: CalendarDaysIcon,
          color: '#FF971E'
        },
        {
          name: 'Approvals',
          label: i18next.t('app.mainMenu.approvals'),
          icon: EarthIcon,
          color: '#5E9F5D'
        },
        {
          name: 'Events',
          label: i18next.t('app.mainMenu.events'),
          icon: CalendarPlus2Icon,
          color: '#D802FD'
        },
        {
          name: 'Assignments',
          label: i18next.t('app.mainMenu.assignments'),
          icon: BriefcaseBusinessIcon,
          color: '#006bb3'
        },
        {
          name: 'Wires',
          label: i18next.t('app.mainMenu.wires'),
          icon: CableIcon,
          color: '#FF6347'
        },
        {
          name: 'Latest',
          label: i18next.t('app.mainMenu.lastPublished'),
          icon: UtilityPoleIcon,
          color: '#996633',
          target: 'sheet'
        },
        {
          name: 'Factboxes',
          label: i18next.t('app.mainMenu.factboxes'),
          icon: BoxesIcon,
          color: '#99c5c4'
        }
      ]
    },
    {
      name: 'actions',
      items: [
        {
          name: 'Flash',
          label: i18next.t('app.mainMenu.createFlash'),
          icon: ZapIcon,
          color: '#FF5150',
          target: 'dialog'
        },
        {
          name: 'Search',
          label: i18next.t('app.mainMenu.search'),
          icon: SearchIcon,
          color: '#F06F21'
        }
      ]
    },
    {
      name: 'Print',
      items: [
        {
          name: 'Print',
          label: i18next.t('app.mainMenu.print'),
          icon: LibraryIcon,
          color: '#006bb3'
        }
      ]
    }
  ]
}
