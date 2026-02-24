import { ZapIcon, ZapOffIcon, NewspaperIcon } from '@ttab/elephant-ui/icons'
import i18next from 'i18next'

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
    baseTitle: i18next.t('flash:title'),
    newDialogTitle: i18next.t('flash:titles.newFlashTitle'),
    iconColor: '#FF5150',
    linkTarget: 'Flash',
    statusErrorText: i18next.t('errors:messages.statusChangeforDocumentTypeFailed', { documentType: i18next.t('flash:title') })
  },
  QuickArticle: {
    icon: NewspaperIcon,
    baseTitle: i18next.t('quickArticle:title'),
    newDialogTitle: i18next.t('quickArticle:newQuickArticleTitle'),
    iconColor: '#aabbcc',
    linkTarget: 'Planning',
    statusErrorText: i18next.t('errors:messages.statusChangeforDocumentTypeFailed', { documentType: i18next.t('quickArticle:title') })
  }
}
