import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@ttab/elephant-ui'
import type { PropsWithChildren } from 'react'
import { useModal } from './useModal'

export const ModalSheet = ({ children, isVisible }: {
  isVisible: boolean
} & PropsWithChildren): JSX.Element => {
  const { hideModal } = useModal()
  return (
    <Sheet open={isVisible}>
      <SheetContent
        onPointerDownOutside={hideModal}
        side='bottom'
        className='p-3 h-1/2 max-w-[1000px] mx-auto rounded-t rounded-lg'
      >
        <SheetTitle />
        <SheetDescription />
        <div className='h-full flex flex-grow gap-4 p-6 pb-12 pt-0'>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
