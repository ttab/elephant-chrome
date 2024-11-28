import {
  useState,
  type PropsWithChildren,
  type ReactNode
} from 'react'
import { ModalContext } from './ModalContext'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { ModalDialog } from './ModalDialog'
import { ModalSheet } from './ModalSheet'

export const ModalProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false)
  const [modalContent, setModalContent] = useState<ReactNode | null>(null)
  const [modalType, setModalType] = useState<string | undefined>(undefined)

  useKeydownGlobal((evt) => {
    if (evt.key === 'Escape') {
      hideModal()
    }
  })

  const showModal = (content: ReactNode, type: string = 'dialog'): void => {
    setModalContent(content)
    setModalType(type)
    setIsVisible(true)
  }

  const hideModal = (): void => {
    setIsVisible(false)
    setModalContent(null)
    setModalType(undefined)
  }

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      { modalType === 'dialog' && (
        <ModalDialog isVisible={isVisible}>
          {modalContent}
        </ModalDialog>
      )}
      { modalType === 'sheet' && (
        <ModalSheet isVisible={isVisible}>
          {modalContent}
        </ModalSheet>
      )}
    </ModalContext.Provider>
  )
}
