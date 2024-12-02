import { cn } from '@ttab/elephant-ui/utils'
import type { PropsWithChildren } from 'react'

export const LoadingText = ({ children, className }: {
  className?: string
} & PropsWithChildren): JSX.Element => {
  return (
    <p className={cn('w-full h-full flex justify-center items-center text-lg font-bold opacity-50', className)}>
      {children}
    </p>
  )
}
