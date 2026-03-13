import {
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CalendarPlus2Icon,
  NewspaperIcon,
  BoxesIcon,
  FileWarningIcon,
  PenBoxIcon,
  PenOffIcon,
  ZapIcon,
  type LucideIcon
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
    label: 'Händelse',
    key: 'Event',
    color: '#D802FD'
  }
}

const planning: DocumentTypeFormat = {
  'core/planning-item': {
    icon: CalendarDaysIcon,
    label: 'Planering',
    key: 'Planning',
    color: '#FF971E'
  }
}

const assignment: DocumentTypeFormat = {
  'core/assignment': {
    icon: BriefcaseBusinessIcon,
    label: 'Uppdrag',
    key: 'Assignment',
    color: '#006bb3'
  }
}

const article: DocumentTypeFormat = {
  'core/article': {
    icon: PenBoxIcon,
    label: 'Artikel',
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
    label: 'Till red',
    key: 'EditorialInfo',
    color: '#50BEBF'
  }
}

const factbox: DocumentTypeFormat = {
  'core/factbox': {
    icon: BoxesIcon,
    label: 'Faktaruta',
    key: 'Factbox',
    color: '#99c5c4'
  }
}

const flash: DocumentTypeFormat = {
  'core/flash': {
    icon: ZapIcon,
    label: 'Flash',
    key: 'Flash',
    color: '#FF5150'
  }
}

const quickArticle: DocumentTypeFormat = {
  'core/article': {
    icon: NewspaperIcon,
    label: 'Två på två',
    key: 'Article',
    color: '#aabbcc'
  }
}


export const documentTypeValueFormat = {
  ...event,
  ...planning,
  ...article,
  ...editorialInfo,
  ...factbox,
  ...flash
}

export const addButtonGroupValueFormat = {
  ...event,
  ...planning,
  ...assignment,
  ...quickArticle,
  ...editorialInfo,
  ...factbox,
  ...flash
}
