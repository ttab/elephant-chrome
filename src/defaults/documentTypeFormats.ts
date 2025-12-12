import {
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CalendarPlus2Icon,
  NewspaperIcon
} from '@ttab/elephant-ui/icons'
import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { BoxesIcon } from 'lucide-react'

export const documentTypeValueFormat: Record<string, { icon: LucideIcon, key: string, label: string, color: string }> = {
  'core/event': {
    icon: CalendarPlus2Icon,
    label: 'Händelse',
    key: 'Event',
    color: '#5E9F5D'
  },
  'core/planning-item': {
    icon: CalendarDaysIcon,
    label: 'Planering',
    key: 'Planning',
    color: '#FF971E'
  },
  'core/assignment': {
    icon: BriefcaseBusinessIcon,
    label: 'Uppdrag',
    key: 'Assignment',
    color: '#006bb3'
  },
  'core/article': {
    icon: NewspaperIcon,
    label: 'Artikel',
    key: 'Article',
    color: '#50BEBF'
  },
  'core/factbox': {
    icon: BoxesIcon,
    label: 'Faktaruta',
    key: 'Factbox',
    color: '#99c5c4'
  }
}
