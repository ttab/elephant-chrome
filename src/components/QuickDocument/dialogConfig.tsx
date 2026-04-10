import { type Dispatch, type SetStateAction } from 'react'
import type { CreateArticleDocumentStatus } from '@/views/QuickArticle/lib/createQuickArticle'
import type { DefaultValueOption } from '@/types/index'
import type { CreateFlashDocumentStatus } from '@/views/Flash/lib/createFlash'

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
  type: 'article' | 'flash'
  selectedPlanning: Omit<DefaultValueOption, 'payload'> & { payload: unknown } | undefined
  setSavePrompt: Dispatch<SetStateAction<boolean>>
  setSendPrompt: Dispatch<SetStateAction<boolean>>
  setDonePrompt: Dispatch<SetStateAction<boolean>>
  savePrompt: boolean
  donePrompt: boolean
  sendPrompt: boolean
  shouldCreateQuickArticle?: boolean
}): PromptConfig[] => {
  const documentType = type === 'article' ? 'artikel' : 'flash'
  const isFlash = type === 'flash'

  const flashUsableDescription = shouldCreateQuickArticle ? `I samma planering läggs det även till ett nytt textuppdrag med flashinnehållet, med status Klar.` : ''
  const articleUsableDescription = 'Artikeln kommer att ha status Godkänd. Kom ihåg att uppdatera och publicera planeringen!'

  return [
    {
      visible: sendPrompt,
      key: 'send',
      title: isFlash
        ? `Skapa och skicka flash?`
        : `Godkänn artikel?`,
      description: !selectedPlanning
        ? `En ny planering med tillhörande uppdrag för denna ${documentType} skapas åt dig.`
        : `Denna ${documentType} kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}".`,
      secondaryDescription: isFlash
        ? flashUsableDescription
        : articleUsableDescription,
      secondaryLabel: 'Avbryt',
      primaryLabel: isFlash ? 'Publicera' : 'Godkänn',
      documentStatus: (isFlash ? 'usable' : 'approved') as CreateArticleDocumentStatus,
      setPrompt: setSendPrompt
    },
    {
      visible: donePrompt,
      key: 'done',
      title: `Skapa och klarmarkera ${documentType}?`,
      description: !selectedPlanning
        ? `En ny planering med tillhörande uppdrag för denna ${documentType} skapas åt dig.`
        : `Denna ${documentType} kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}", med status Klar.`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Klarmarkera',
      documentStatus: 'done' as CreateArticleDocumentStatus,
      setPrompt: setDonePrompt
    },
    {
      visible: savePrompt,
      key: 'save',
      title: `Spara ${documentType}?`,
      description: !selectedPlanning
        ? `En ny planering med tillhörande uppdrag för denna ${documentType} skapas åt dig.`
        : `Denna ${documentType} kommer att läggas i ett nytt uppdrag i planeringen "${selectedPlanning.label}"`,
      secondaryLabel: 'Avbryt',
      primaryLabel: 'Spara',
      documentStatus: undefined,
      setPrompt: setSavePrompt
    }
  ]
}

export const getLabel = (documentStatus: CreateFlashDocumentStatus, type: 'article' | 'flash'): string => {
  const documentType = type === 'article' ? 'Artikel' : 'Flash'

  switch (documentStatus) {
    case 'usable': {
      return `${documentType} ${type === 'flash' ? 'skickad' : 'publicerad'}`
    }
    case 'approved': {
      return `${documentType} godkänd`
    }
    case 'done': {
      return `${documentType} klar`
    }
    default: {
      return `${documentType} sparad`
    }
  }
}
