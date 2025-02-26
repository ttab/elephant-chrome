import { cn } from '@ttab/elephant-ui/utils'
import { type PropsWithChildren } from 'react'

export const Content = ({ children, className }: PropsWithChildren & {
  className?: string
}): JSX.Element => {
  return (
    <div className={cn('flex flex-1 gap-4 items-center h-14 grow', className)}>
      {children}
    </div>
  )
}
