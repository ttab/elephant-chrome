import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@ttab/elephant-ui'
import type { PropsWithChildren } from 'react'
import { useModal } from './useModal'
import { cn } from '@ttab/elephant-ui/utils'

export const ModalSheet = ({ children, isVisible, side }: {
  isVisible: boolean
  side?: string
} & PropsWithChildren): JSX.Element => {
  const { hideModal } = useModal()
  return (
    <Sheet open={isVisible}>
      <SheetContent
        onPointerDownOutside={hideModal}
        side={side || 'bottom'}
        className={cn('p-3 mx-auto rounded-t rounded-lg', side === 'right'
          ? 'h-full min-w-[25vw]'
          : 'h-2/3 max-w-[1000px]')}
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
