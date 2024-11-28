import { createContext, type ReactNode } from 'react'

type modalType = 'dialog' | 'sheet'
export interface ModalContextType {
  showModal: (content: ReactNode, type?: modalType) => void
  hideModal: () => void
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined)
