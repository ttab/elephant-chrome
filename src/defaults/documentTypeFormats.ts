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

const event: DocumentTypeFormat = {
  'core/event': {
    icon: CalendarPlus2Icon,
    get label() { return i18n.t('views:events.label.singular') },
    key: 'Event',
    color: '#D802FD'
  }
}

const planning: DocumentTypeFormat = {
  'core/planning-item': {
    icon: CalendarDaysIcon,
    get label() { return i18n.t('views:plannings.label.singular') },
    key: 'Planning',
    color: '#FF971E'
  }
}

const assignment: DocumentTypeFormat = {
  'core/assignment': {
    icon: BriefcaseBusinessIcon,
    get label() { return i18n.t('views:assignments.title') },
    key: 'Assignment',
    color: '#006bb3'
  }
}

const article: DocumentTypeFormat = {
  'core/article': {
    icon: PenBoxIcon,
    get label() { return i18n.t('shared:assignmentTypes.text') },
    key: 'Article',
    color: '#50BEBF',
    readonly: {
      icon: PenOffIcon
    }
  }
}

const editorialInfo: DocumentTypeFormat = {
  'core/editorial-info': {
    icon: FileWarningIcon,
    get label() { return i18n.t('shared:assignmentTypes.editorial-info') },
    key: 'EditorialInfo',
    color: '#50BEBF'
  }
}

const factbox: DocumentTypeFormat = {
  'core/factbox': {
    icon: BoxesIcon,
    get label() { return i18n.t('factbox:title') },
    key: 'Factbox',
    color: '#99c5c4'
  }
}

const flash: DocumentTypeFormat = {
  'core/flash': {
    icon: ZapIcon,
    get label() { return i18n.t('flash:title') },
    key: 'Flash',
    color: '#FF5150'
  }
}

const timelessArticle: DocumentTypeFormat = {
  'core/article#timeless': {
    icon: BookmarkIcon,
    get label() { return i18n.t('shared:assignmentTypes.timeless') },
    key: 'Editor',
    color: '#7C6F9C',
    readonly: {
      icon: PenOffIcon
    }
  }
}

const quickArticle: DocumentTypeFormat = {
  'core/article': {
    icon: NewspaperIcon,
    get label() { return i18n.t('quickArticle:title') },
    key: 'QuickArticle',
    color: '#aabbcc'
  }
}

const printArticle: DocumentTypeFormat = {
  'tt/print-article': {
    icon: LibraryIcon,
    get label() { return i18n.t('print:articles.title') },
    key: 'PrintArticle',
    color: '#aabbcc'
  }
}


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
