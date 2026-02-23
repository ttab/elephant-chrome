import i18n from '@/lib/i18n'
import {
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CalendarPlus2Icon,
  NewspaperIcon,
  BoxesIcon,
  type LucideIcon
} from '@ttab/elephant-ui/icons'
import { ZapIcon } from 'lucide-react'

export const documentTypeValueFormat: Record<string, { icon: LucideIcon, key: string, label: string, color: string }> = {
  'core/event': {
    icon: CalendarPlus2Icon,
    label: i18n.t('views:events.label.singular'),
    key: 'Event',
    color: '#5E9F5D'
  },
  'core/planning-item': {
    icon: CalendarDaysIcon,
    label: i18n.t('views:plannings.label.singular'),
    key: 'Planning',
    color: '#FF971E'
  },
  'core/assignment': {
    icon: BriefcaseBusinessIcon,
    label: i18n.t('views:assignments.title'),
    key: 'Assignment',
    color: '#006bb3'
  },
  'core/article': {
    icon: NewspaperIcon,
    label: i18n.t('quickArticle:title'),
    key: 'Article',
    color: '#50BEBF'
  },
  'core/factbox': {
    icon: BoxesIcon,
    label: i18n.t('factbox:title'),
    key: 'Factbox',
    color: '#99c5c4'
  },
  'core/flash': {
    icon: ZapIcon,
    label: i18n.t('flash:title'),
    key: 'Flash',
    color: '#FF5150'
  }
}
