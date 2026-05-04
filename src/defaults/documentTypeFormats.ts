import i18n from 'i18next'
import {
  BriefcaseBusinessIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  CalendarPlus2Icon,
  NewspaperIcon,
  BoxesIcon,
  FileWarningIcon,
  PenBoxIcon,
  PenOffIcon,
  ZapIcon,
  type LucideIcon,
  LibraryIcon
} from '@ttab/elephant-ui/icons'

type DocumentTypeFormat = Record<string, {
  icon: LucideIcon
  key: string
  label: string
  color: string
  readonly?: {
    icon: LucideIcon
  }
}>

const event = {
  'core/event': {
    icon: CalendarPlus2Icon,
    get label() { return i18n.t('views:events.label.singular') },
    key: 'Event',
    color: '#D802FD'
  }
} satisfies DocumentTypeFormat

const planning = {
  'core/planning-item': {
    icon: CalendarDaysIcon,
    get label() { return i18n.t('views:plannings.label.singular') },
    key: 'Planning',
    color: '#FF971E'
  }
} satisfies DocumentTypeFormat

const assignment = {
  'core/assignment': {
    icon: BriefcaseBusinessIcon,
    get label() { return i18n.t('views:assignments.title') },
    key: 'Assignment',
    color: '#006bb3'
  }
} satisfies DocumentTypeFormat

const article = {
  'core/article': {
    icon: PenBoxIcon,
    get label() { return i18n.t('shared:assignmentTypes.text') },
    key: 'Article',
    color: '#50BEBF',
    readonly: {
      icon: PenOffIcon
    }
  }
} satisfies DocumentTypeFormat

const editorialInfo = {
  'core/editorial-info': {
    icon: FileWarningIcon,
    get label() { return i18n.t('shared:assignmentTypes.editorial-info') },
    key: 'EditorialInfo',
    color: '#50BEBF'
  }
} satisfies DocumentTypeFormat

const factbox = {
  'core/factbox': {
    icon: BoxesIcon,
    get label() { return i18n.t('factbox:title') },
    key: 'Factbox',
    color: '#99c5c4'
  }
} satisfies DocumentTypeFormat

const flash = {
  'core/flash': {
    icon: ZapIcon,
    get label() { return i18n.t('flash:title') },
    key: 'Flash',
    color: '#FF5150'
  }
} satisfies DocumentTypeFormat

const timelessArticle = {
  'core/article#timeless': {
    icon: BookmarkIcon,
    get label() { return i18n.t('shared:assignmentTypes.timeless') },
    key: 'Editor',
    color: '#7C6F9C',
    readonly: {
      icon: PenOffIcon
    }
  }
} satisfies DocumentTypeFormat

const quickArticle = {
  'core/article': {
    icon: NewspaperIcon,
    get label() { return i18n.t('quickArticle:title') },
    key: 'QuickArticle',
    color: '#aabbcc'
  }
} satisfies DocumentTypeFormat

const printArticle = {
  'tt/print-article': {
    icon: LibraryIcon,
    get label() { return i18n.t('print:articles.title') },
    key: 'PrintArticle',
    color: '#aabbcc'
  }
} satisfies DocumentTypeFormat


export const documentTypeValueFormat = {
  ...event,
  ...planning,
  ...article,
  ...timelessArticle,
  ...editorialInfo,
  ...factbox,
  ...flash,
  ...printArticle
}

export const addButtonGroupValueFormat = {
  ...event,
  ...planning,
  ...assignment,
  ...quickArticle,
  ...editorialInfo,
  ...factbox,
  ...flash,
  ...timelessArticle
}
