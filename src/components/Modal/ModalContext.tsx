import { createContext, type ReactNode } from 'react'

export type ModalSide = 'bottom' | 'left' | 'right' | 'top'

export interface ModalData {
  id: string
}

type modalType = 'dialog' | 'sheet'
export interface ModalContextType {
  showModal: (content: ReactNode, type?: modalType, data?: ModalData, side?: ModalSide) => void
  hideModal: () => void
  currentModal: ModalData | undefined
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined)
