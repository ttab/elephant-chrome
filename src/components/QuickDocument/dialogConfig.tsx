import { type Dispatch, type SetStateAction } from 'react'
import type { CreateArticleDocumentStatus } from '@/views/QuickArticle/lib/createQuickArticle'
import type { DefaultValueOption } from '@/types/index'
import type { CreateFlashDocumentStatus } from '@/views/Flash/lib/createFlash'
import i18next from 'i18next'

export type PromptConfig = {
  visible: boolean
  key: string
  title: string
  description: string
  secondaryDescription?: string
  secondaryLabel: string
  primaryLabel: string
  documentStatus: CreateArticleDocumentStatus
  setPrompt: Dispatch<SetStateAction<boolean>>
}

export const promptConfig = ({
  type,
  selectedPlanning,
  setSavePrompt,
  setSendPrompt,
  setDonePrompt,
  savePrompt,
  donePrompt,
  sendPrompt
}: {
  type: 'article' | 'flash'
  selectedPlanning: Omit<DefaultValueOption, 'payload'> & { payload: unknown } | undefined
  setSavePrompt: Dispatch<SetStateAction<boolean>>
  setSendPrompt: Dispatch<SetStateAction<boolean>>
  setDonePrompt: Dispatch<SetStateAction<boolean>>
  savePrompt: boolean
  donePrompt: boolean
  sendPrompt: boolean
}): PromptConfig[] => {
  const documentType = type === 'article' ? i18next.t('core:documentType.article') : i18next.t('core:documentType.flash')
  const isFlash = type === 'flash'

  return [
    {
      visible: sendPrompt,
      key: 'send',
      title: isFlash
        ? i18next.t(`flash:titles.createAndSendType`, { type: documentType })
        : i18next.t(`flash:titles.approveType`, { type: documentType }),
      description: !selectedPlanning
        ? i18next.t(`flash:promptDescriptions.newPlanningWillBeCreated`, { type: documentType })
        : i18next.t(`flash:promptDescriptions.typeWillBeAddedToPlanning`, { type: documentType, planningName: selectedPlanning.label }),
      secondaryDescription: isFlash
        ? i18next.t(`flash:promptDescriptions.alsoTypeCreated`, { type: documentType })
        : i18next.t('flash:promptDescriptions.alsoTypeCreatedWithApproved'),
      secondaryLabel: i18next.t('common:actions.abort'),
      primaryLabel: isFlash ? i18next.t('core:status.action.publish') : i18next.t('common:actions.approve'),
      documentStatus: (isFlash ? 'usable' : 'approved') as CreateArticleDocumentStatus,
      setPrompt: setSendPrompt
    },
    {
      visible: donePrompt,
      key: 'done',
      title: i18next.t(`flash:titles.createAndMarkTypeAsDone`, { type: documentType }),
      description: !selectedPlanning
        ? i18next.t(`flash:promptDescriptions.newPlanningWillBeCreated`, { type: documentType })
        : i18next.t(`flash:promptDescriptions.typeWillBeAddedToPlanning`, { type: documentType, planningName: selectedPlanning.label }),
      secondaryLabel: i18next.t('common:actions.abort'),
      primaryLabel: i18next.t('common:actions.markAsDone'),
      documentStatus: 'done' as CreateArticleDocumentStatus,
      setPrompt: setDonePrompt
    },
    {
      visible: savePrompt,
      key: 'save',
      title: i18next.t(`common:actions.saveType`, { type: documentType }),
      description: !selectedPlanning
        ? i18next.t(`flash:promptDescriptions.newPlanningWillBeCreated`, { type: documentType })
        : i18next.t(`flash:promptDescriptions.typeWillBeAddedToPlanning`, { type: documentType, planningName: selectedPlanning.label }),
      secondaryLabel: i18next.t('common:actions.abort'),
      primaryLabel: i18next.t('common:actions.save'),
      documentStatus: undefined,
      setPrompt: setSavePrompt
    }
  ]
}

export const getLabel = (documentStatus: CreateFlashDocumentStatus, type: 'article' | 'flash'): string => {
  const documentType = type === 'article' ? i18next.t('core:documentType.article') : i18next.t('core:documentType.flash')

  switch (documentStatus) {
    case 'usable': {
      return `${documentType} ${type === 'flash' ? i18next.t('core:status.sent') : i18next.t('core:status.usable')}`
    }
    case 'approved': {
      return i18next.t('core:status.typeApproved', { type: documentType })
    }
    case 'done': {
      return i18next.t('core:status.typeDone', { type: documentType })
    }
    default: {
      return i18next.t('core:status.typeSaved', { type: documentType })
    }
  }
}
