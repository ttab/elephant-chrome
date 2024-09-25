import {
  useState,
  type PropsWithChildren,
  type ReactNode
} from 'react'
import {
  Dialog,
  DialogContent
} from '@ttab/elephant-ui'
import { ModalContext } from './ModalContext'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'

export const ModalProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false)
  const [modalContent, setModalContent] = useState<ReactNode | null>(null)

  useKeydownGlobal(evt => {
    if (evt.key === 'Escape') {
      hideModal()
    }
  })

  const showModal = (content: ReactNode): void => {
    setModalContent(content)
    setIsVisible(true)
  }

  const hideModal = (): void => {
    setIsVisible(false)
    setModalContent(null)
  }

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}

      {isVisible && (
        <Dialog open={isVisible}>
          <DialogContent>
            {modalContent}
          </DialogContent>
        </Dialog>
      )}
    </ModalContext.Provider>
  )
}
