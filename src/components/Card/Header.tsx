import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const Header = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div className={cn('flex flex-row justify-between', className)}>
      {children}
    </div>
  )
}
