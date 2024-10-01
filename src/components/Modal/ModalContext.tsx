import { createContext, type ReactNode } from 'react'

export interface ModalContextType {
  showModal: (content: ReactNode) => void
  hideModal: () => void
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined)
