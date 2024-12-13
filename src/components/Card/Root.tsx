import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const Root = ({ className, children }: {
  className?: string
} & PropsWithChildren) => {
  return (
    <div tabIndex={0} className={cn('flex flex-col justify-stretch gap-2 border bg-white rounded p-2 text-xs', className)}>
      {children}
    </div>
  )
}
