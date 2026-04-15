import { type MouseEvent, type JSX } from 'react'
import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { ExternalLinkIcon, RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useTranslation } from 'react-i18next'

interface TimelessRowActionsProps {
  documentId: string
}

export function TimelessRowActions({ documentId }: TimelessRowActionsProps): JSX.Element {
  const { convert, isConverting } = useConvertArticleType()
  const { t } = useTranslation(['views', 'common'])

  const handleOpenNewTab = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    window.open(`${import.meta.env.BASE_URL}/editor?id=${documentId}`, '_blank')
  }

  const handleConvert = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    void convert(documentId, 'core/article')
  }

  const menuItems: DotDropdownMenuActionItem[] = [
    {
      label: t('views:timeless.actions.openNewTab'),
      icon: ExternalLinkIcon,
      item: handleOpenNewTab
    },
    {
      label: t('views:timeless.actions.convertToArticle'),
      icon: RefreshCwIcon,
      disabled: isConverting,
      item: handleConvert
    }
  ]

  return <DotMenu items={menuItems} />
}
