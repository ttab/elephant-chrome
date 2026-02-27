import { ZapIcon, ZapOffIcon, NewspaperIcon } from '@ttab/elephant-ui/icons'

export type DocumentView = 'Flash' | 'QuickArticle'

interface ViewConfig {
  icon: typeof ZapIcon
  readOnlyIcon?: typeof ZapIcon
  baseTitle: string
  newDialogTitle: string
  iconColor: string
  linkTarget: 'Flash' | 'Planning'
  statusErrorText: string
}

export const ViewMap: Record<DocumentView, ViewConfig> = {
  Flash: {
    icon: ZapIcon,
    readOnlyIcon: ZapOffIcon,
    baseTitle: 'Flash',
    newDialogTitle: 'Skapa ny flash',
    iconColor: '#FF5150',
    linkTarget: 'Flash',
    statusErrorText: 'Kunde inte ändra status på flash! Det gick inte att hitta en kopplad planering.'
  },
  QuickArticle: {
    icon: NewspaperIcon,
    baseTitle: 'Två på två',
    newDialogTitle: 'Skapa ny två på två',
    iconColor: '#aabbcc',
    linkTarget: 'Planning',
    statusErrorText: 'Kunde inte ändra status på artikel! Det gick inte att hitta en kopplad planering.'
  }
}
