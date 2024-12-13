import type { CSSProperties, PropsWithChildren } from 'react'
import { ScrollArea } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'

export const Content = ({ children, className, style, autoScroll = true }: {
  className?: string
  autoScroll?: boolean
  style?: CSSProperties
} & PropsWithChildren): JSX.Element => {
  return (
    <>
      {autoScroll
        ? (
            <ScrollArea className={cn(' flex-1 w-full mx-auto overflow-hidden h-full', className)} style={style}>
              {children}
            </ScrollArea>
          )
        : (
            <div className={className} style={style}>
              {children}
            </div>
          )
      }
    </>
  )
}
