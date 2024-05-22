import { cn } from '@ttab/elephant-ui/utils'
import { type PropsWithChildren } from 'react'

export const Root = ({ children, className }: PropsWithChildren &
{
  className?: string
}): JSX.Element => {
  return (
    <header className={
      cn(
        'sticky top-0 flex items-center justify-items-start group-first/view-container:ml-[2.5rem] h-14 gap-4 px-3 border-b bg-background z-50',
        className
      )
    }>
      {children}
    </header>
  )
}
