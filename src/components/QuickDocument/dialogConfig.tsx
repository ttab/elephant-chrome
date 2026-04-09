import { type Dispatch, type SetStateAction } from 'react'
import type { CreateArticleDocumentStatus } from '@/views/QuickArticle/lib/createQuickArticle'
import type { DefaultValueOption } from '@/types/index'
import type { CreateFlashDocumentStatus } from '@/views/Flash/lib/createFlash'
import i18next from 'i18next'

type QuickDocumentType = 'article' | 'flash' | 'hast'

function getDocumentTypeLabel(type: QuickDocumentType): string {
  switch (type) {
    case 'article': return i18next.t('core:documentType.article')
    case 'hast': return i18next.t('flash:hastLabel')
    case 'flash': return i18next.t('core:documentType.flash')
  }
}

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
  sendPrompt,
  shouldCreateQuickArticle
}: {
  type: QuickDocumentType
  selectedPlanning: Omit<DefaultValueOption, 'payload'> & { payload: unknown } | undefined
  setSavePrompt: Dispatch<SetStateAction<boolean>>
  setSendPrompt: Dispatch<SetStateAction<boolean>>
  setDonePrompt: Dispatch<SetStateAction<boolean>>
  savePrompt: boolean
  donePrompt: boolean
  sendPrompt: boolean
  shouldCreateQuickArticle?: boolean
}): PromptConfig[] => {
  const isFlash = type === 'flash'
  const isHast = type === 'hast'
  const documentType = getDocumentTypeLabel(type)

  const flashUsableDescription = shouldCreateQuickArticle
    ? i18next.t('flash:promptDescriptions.alsoTypeCreated', { type: documentType })
    : ''
  const articleUsableDescription = i18next.t(
    'flash:promptDescriptions.alsoTypeCreatedWithApproved'
  )

  return [
    {
      visible: sendPrompt,
      key: 'send',
      title: isFlash || isHast
        ? i18next.t('flash:titles.createAndSendType', { type: isFlash ? i18next.t('flash:title') : i18next.t('flash:hastLabel') })
        : i18next.t('flash:titles.approveType', { type: documentType }),
      description: !selectedPlanning
        ? i18next.t('flash:promptDescriptions.newPlanningWillBeCreated', {
          type: documentType
        })
        : i18next.t('flash:promptDescriptions.typeWillBeAddedToPlanning', {
          type: documentType,
          planningName: selectedPlanning.label
        }),
      secondaryDescription: isFlash
        ? flashUsableDescription
        : isHast
          ? undefined
          : articleUsableDescription,
      secondaryLabel: i18next.t('common:actions.abort'),
      primaryLabel: isFlash || isHast
        ? i18next.t('common:actions.publish')
        : i18next.t('common:actions.approve'),
      documentStatus: (isFlash || isHast
        ? 'usable'
        : 'approved') as CreateArticleDocumentStatus,
      setPrompt: setSendPrompt
    },
    {
      visible: donePrompt,
      key: 'done',
      title: i18next.t('flash:titles.createAndMarkTypeAsDone', {
        type: documentType
      }),
      description: !selectedPlanning
        ? i18next.t('flash:promptDescriptions.newPlanningWillBeCreated', {
          type: documentType
        })
        : i18next.t('flash:promptDescriptions.typeWillBeAddedToPlanning', {
          type: documentType,
          planningName: selectedPlanning.label
        }),
      secondaryLabel: i18next.t('common:actions.abort'),
      primaryLabel: i18next.t('common:actions.markAsDone'),
      documentStatus: 'done' as CreateArticleDocumentStatus,
      setPrompt: setDonePrompt
    },
    {
      visible: savePrompt,
      key: 'save',
      title: i18next.t('common:actions.saveType', { type: documentType }),
      description: !selectedPlanning
        ? i18next.t('flash:promptDescriptions.newPlanningWillBeCreated', {
          type: documentType
        })
        : i18next.t('flash:promptDescriptions.typeWillBeAddedToPlanning', {
          type: documentType,
          planningName: selectedPlanning.label
        }),
      secondaryLabel: i18next.t('common:actions.abort'),
      primaryLabel: i18next.t('common:actions.save'),
      documentStatus: undefined,
      setPrompt: setSavePrompt
    }
  ]
}

export const getLabel = (
  documentStatus: CreateFlashDocumentStatus,
  type: QuickDocumentType
): string => {
  const documentType = getDocumentTypeLabel(type)

  switch (documentStatus) {
    case 'usable': {
      return type === 'flash' || type === 'hast'
        ? i18next.t('core:status.typeSent', { type: documentType })
        : `${documentType} ${i18next.t('core:status.usable')}`
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
