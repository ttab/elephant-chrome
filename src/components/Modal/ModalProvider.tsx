import {
  useState,
  type PropsWithChildren,
  type ReactNode
} from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
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

      {/*
        * FIXME: We need this to be modal. But for now the prop
        * modal is set to false due to bug in radix which result
        * in portal mouse events conflicts.
        *
        * https://github.com/radix-ui/primitives/issues/3141
        */}
      {isVisible && (
        <Dialog modal={false} open={isVisible}>
          <DialogTitle></DialogTitle>
          <DialogContent className="p-0 w-[94vw]">
            {modalContent}
          </DialogContent>
        </Dialog>
      )}
    </ModalContext.Provider>
  )
}
