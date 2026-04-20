import { type MouseEvent, type JSX, useState } from 'react'
import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { CalendarDaysIcon, RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { ConvertToArticleDialog } from '@/components/ConvertToArticleDialog'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
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
  const openPlanning = useLink('Planning')
  const planningId = useDeliverableInfo(documentId)?.planningUuid ?? ''
  const isUsed = status === 'used'

  const handleOpenPlanning = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (planningId) {
      openPlanning(undefined, { id: planningId })
    }
  }

  const handleConvert = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDialogOpen(true)
  }

  const menuItems: DotDropdownMenuActionItem[] = [
    {
      label: t('views:timeless.actions.openPlanning'),
      icon: CalendarDaysIcon,
      disabled: !planningId,
      item: handleOpenPlanning
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
