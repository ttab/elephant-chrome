import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const Title = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div className={cn('font-bold', className)}>
      {children}
    </div>
  )
}
