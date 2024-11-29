import { Sheet, SheetHeader, SheetContent, SheetDescription, SheetTitle } from '@ttab/elephant-ui'
import type { PropsWithChildren } from 'react'

export const ModalSheet = ({ children, isVisible }: {
  isVisible: boolean
} & PropsWithChildren): JSX.Element => (

  <Sheet open={isVisible}>
    <SheetContent
      side='bottom'
      className='h-1/3 focus:outline-none'
    >
      <SheetHeader>
        <SheetDescription />
        <SheetTitle />
      </SheetHeader>
      {children}
    </SheetContent>
  </Sheet>
)
