import { Dialog, DialogDescription, DialogTitle, DialogContent } from '@ttab/elephant-ui'
import  type { PropsWithChildren } from 'react'

export const ModalDialog = ({ children, isVisible }: {
  isVisible: boolean
} & PropsWithChildren): JSX.Element => (
  <Dialog open={isVisible}>
    <DialogDescription />
    <DialogTitle />
    <DialogContent
      className='p-0 w-[94vw]'
      onEscapeKeyDown={(event) => {
        event.preventDefault()
      }}
    >
      {children}
    </DialogContent>
  </Dialog>
)
