import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren, JSX } from 'react'

export const Content = ({ children, className }: PropsWithChildren & {
  className?: string
}): JSX.Element => {
  return (
    <div className={cn('flex flex-1 gap-1.5 @xl/view:gap-4 items-center h-14 grow', className)}>
      {children}
    </div>
  )
}
