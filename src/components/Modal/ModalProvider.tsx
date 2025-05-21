import {
  useState,
  type PropsWithChildren,
  type ReactNode
} from 'react'
import type { ModalData } from './ModalContext'
import { ModalContext } from './ModalContext'
import { ModalDialog } from './ModalDialog'
import { ModalSheet } from './ModalSheet'

export const ModalProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false)
  const [side, setSide] = useState<string>('bottom')
  const [modalData, setModalData] = useState<ModalData | undefined>(undefined)
  const [modalContent, setModalContent] = useState<ReactNode | null>(null)
  const [modalType, setModalType] = useState<string | undefined>(undefined)

  const showModal = (content: ReactNode, type: string = 'dialog', data: ModalData | undefined, side: string = 'bottom'): void => {
    setModalContent(content)
    setModalType(type)
    setModalData(data)
    setIsVisible(true)
    setSide(side)
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
        <ModalSheet isVisible={isVisible} side={side}>
          {modalContent}
        </ModalSheet>
      )}
    </ModalContext.Provider>
  )
}
