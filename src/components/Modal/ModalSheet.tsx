import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@ttab/elephant-ui'
import type { PropsWithChildren } from 'react'

export const ModalSheet = ({ children, isVisible }: {
  isVisible: boolean
} & PropsWithChildren): JSX.Element => {
  return (
    <Sheet open={isVisible}>
      <SheetContent
        side='bottom'
        className='h-1/3 focus:outline-none pb-6'
      >
        <SheetTitle />
        <SheetDescription />
        <div className='flex flex-grow gap-4'>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
