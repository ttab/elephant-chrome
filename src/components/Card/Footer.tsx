import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const Footer = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div className={cn('flex flex-row', className)}>
      {children}
    </div>
  )
}
