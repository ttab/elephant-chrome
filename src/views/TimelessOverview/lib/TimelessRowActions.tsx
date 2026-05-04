import { type MouseEvent, type JSX } from 'react'
import { DotMenu, type DotDropdownMenuActionItem } from '@/components/ui/DotMenu'
import { CalendarDaysIcon, RefreshCwIcon } from '@ttab/elephant-ui/icons'
import { ConvertToArticleDialog } from '@/components/ConvertToArticleDialog'
import { useConvertArticleType } from '@/hooks/useConvertArticleType'
import { useDeliverableInfo } from '@/hooks/useDeliverableInfo'
import { useLink } from '@/hooks/useLink'
import { useModal } from '@/components/Modal/useModal'
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
  const { showModal, hideModal } = useModal()
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
    showModal(
      <ConvertToArticleDialog
        timelessId={documentId}
        onClose={(result) => {
          hideModal()
          if (result?.planningId) {
            openPlanning(undefined, { id: result.planningId })
          }
        }}
      />
    )
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

  return <DotMenu items={menuItems} />
}
