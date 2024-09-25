import { createContext, type ReactNode } from 'react'

// Define the shape of the context
export interface ModalContextType {
  showModal: (content: ReactNode) => void
  hideModal: () => void
}

// Create the Modal context
export const ModalContext = createContext<ModalContextType | undefined>(undefined)
