import { type MouseEvent, type JSX, useState } from 'react'
import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { ExternalLinkIcon, RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { ConvertToArticleDialog } from '@/components/ConvertToArticleDialog'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useLink } from '@/hooks/useLink'
import { useTranslation } from 'react-i18next'

interface TimelessRowActionsProps {
  documentId: string
  status?: string
}

export function TimelessRowActions({
  documentId,
  status
}: TimelessRowActionsProps): JSX.Element {
  const { isConverting } = useConvertArticleType()
  const { t } = useTranslation(['views', 'common'])
  const [dialogOpen, setDialogOpen] = useState(false)
  const openEditor = useLink('Editor')
  const isUsed = status === 'used'

  const handleOpenNewTab = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    window.open(`${import.meta.env.BASE_URL}/editor?id=${documentId}`, '_blank')
  }

  const handleConvert = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDialogOpen(true)
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
      disabled: isConverting || isUsed,
      item: handleConvert
    }
  ]

  return (
    <>
      <DotMenu items={menuItems} />
      {dialogOpen && (
        <ConvertToArticleDialog
          timelessId={documentId}
          onClose={(result) => {
            setDialogOpen(false)
            if (result?.articleId) {
              openEditor(undefined, { id: result.articleId })
            }
          }}
        />
      )}
    </>
  )
}
