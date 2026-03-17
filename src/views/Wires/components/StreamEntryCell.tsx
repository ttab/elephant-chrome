import type { JSX, ReactNode } from 'react'
import { cn } from '@ttab/elephant-ui/utils'

export const StreamEntryCell = ({ children, className }: {
  children: ReactNode
  className?: string
}): JSX.Element => {
  return (
    <div
      className={cn(
        'px-2 py-2',
        'first:ps-4 first:font-thin first:opacity-65',
        'last:pe-4 last:truncate last:min-w-0 last:tracking-[0.015em]',
        className
      )}
    >
      {children}
    </div>
  )
}
