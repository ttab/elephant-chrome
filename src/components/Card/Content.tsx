import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const Content = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {children}
    </div>
  )
}
