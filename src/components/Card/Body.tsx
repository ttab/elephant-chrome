import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const Body = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div className={cn(className)}>
      {children}
    </div>
  )
}
