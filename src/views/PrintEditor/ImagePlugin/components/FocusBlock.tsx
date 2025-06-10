import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const FocusBlock = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  return (
    <div className={cn('relative', className)}>
      <div contentEditable={false} className='absolute inset-0 rounded pointer-events-none ring-offset-4 group-data-[state="active"]:rounded group-data-[state="active"]:ring-1' />
      <div className='relative z-1 rounded'>
        {children}
      </div>
    </div>
  )
}
