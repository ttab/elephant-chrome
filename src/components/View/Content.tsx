import type { CSSProperties, PropsWithChildren, JSX } from 'react'
import { ScrollArea } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'

export const Content = ({ children, variant = 'default', columns = 0, className }: {
  className?: string
  variant?: 'default' | 'grid' | 'no-scroll'
  columns?: number
  style?: CSSProperties
} & PropsWithChildren): JSX.Element => {
  // We manually setup grid fractions because tw grid-cols-N does not work the way we want
  const gridFractions = Array(columns).fill('1fr').join(' ')

  switch (variant) {
    case 'no-scroll':
      return (
        <div className={cn('flex-1 w-full mx-auto overflow-hidden h-full', className)}>
          {children}
        </div>
      )
    case 'grid':
      return (
        <div
          className={cn('grid self-center h-full w-full overflow-scroll snap-x snap-mandatory', className)}
          style={{ gridTemplateColumns: gridFractions }}
        >
          {children}
        </div>
      )
    case 'default':
    default:
      return (
        <ScrollArea className={cn('flex-1 w-full mx-auto overflow-hidden h-full', className)}>
          {children}
        </ScrollArea>
      )
  }
}
