import { ScrollArea } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { PropsWithChildren } from 'react'

export const Content = ({ children, className }: {
  className?: string
} & PropsWithChildren): JSX.Element => {
  return (
    <div className={cn('flex-1 w-full mx-auto overflow-hidden', className)}>
      <ScrollArea className='h-full w-full'>
        {children}
      </ScrollArea>
    </div>
  )
}
