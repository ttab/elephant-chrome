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
          className={cn('grid self-center h-full w-full overflow-auto snap-x snap-mandatory', className)}
          style={{ gridTemplateColumns: gridFractions }}
        >
          {children}
        </div>
      )
    case 'default':
    default:
      return (
        <ScrollArea className={cn('flex-1 w-full mx-auto overflow-hidden h-full [&>div[data-orientation=vertical]]:z-[15] [&>div[data-orientation=vertical]]:!top-10 [&>div[data-orientation=vertical]]:!h-auto', className)}>
          {children}
        </ScrollArea>
      )
  }
}
