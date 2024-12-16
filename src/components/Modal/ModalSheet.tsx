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
        className='p-3 h-1/3 focus:outline-none pb-6 max-w-[1200px] mx-auto rounded-t rounded-lg'
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
