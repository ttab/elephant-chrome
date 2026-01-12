import {
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CalendarPlus2Icon,
  NewspaperIcon
} from '@ttab/elephant-ui/icons'
import { type LucideIcon } from '@ttab/elephant-ui/icons'

export const documentTypeValueFormat: Record<string, { icon: LucideIcon, label: string, color: string }> = {
  'core/event': {
    icon: CalendarPlus2Icon,
    label: 'Händelse',
    color: '#5E9F5D'
  },
  'core/planning-item': {
    icon: CalendarDaysIcon,
    label: 'Planering',
    color: '#FF971E'
  },
  'core/assignment': {
    icon: BriefcaseBusinessIcon,
    label: 'Uppdrag',
    color: '#006bb3'
  },
  'core/article': {
    icon: NewspaperIcon,
    label: 'Artikel',
    color: '#50BEBF'
  }
}
