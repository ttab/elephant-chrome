import {
  useState,
  type PropsWithChildren,
  type ReactNode
} from 'react'
import type { ModalData } from './ModalContext'
import { ModalContext } from './ModalContext'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { ModalDialog } from './ModalDialog'
import { ModalSheet } from './ModalSheet'

export const ModalProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false)
  const [modalData, setModalData] = useState<ModalData | undefined>(undefined)
  const [modalContent, setModalContent] = useState<ReactNode | null>(null)
  const [modalType, setModalType] = useState<string | undefined>(undefined)

  useKeydownGlobal((evt) => {
    if (evt.key === 'Escape') {
      hideModal()
    }
  })

  const showModal = (content: ReactNode, type: string = 'dialog', data: ModalData | undefined): void => {
    setModalContent(content)
    setModalType(type)
    setModalData(data)
    setIsVisible(true)
  }

  const hideModal = (): void => {
    setIsVisible(false)
    setModalContent(null)
    setModalType(undefined)
    setModalData(undefined)
  }

  const currentModal = modalData

  return (
    <ModalContext.Provider value={{ showModal, hideModal, currentModal }}>
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
