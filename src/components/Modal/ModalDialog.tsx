import { Dialog, DialogDescription, DialogTitle, DialogContent } from '@ttab/elephant-ui'
import type { PropsWithChildren, JSX } from 'react'

export const ModalDialog = ({ children, isVisible, onDismiss }: {
  isVisible: boolean
  onDismiss?: () => void
} & PropsWithChildren): JSX.Element => (
  <Dialog
    open={isVisible}
    onOpenChange={(open) => {
      if (!open) {
        onDismiss?.()
      }
    }}
  >
    <DialogDescription />
    <DialogTitle />
    <DialogContent className='p-0 w-[94vw]'>
      {children}
    </DialogContent>
  </Dialog>
)
