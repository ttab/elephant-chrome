import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { getInitials } from '@/lib/getInitials'

import {
  Avatar as AvatarMain,
  AvatarFallback
} from '@ttab/elephant-ui'
import { Collaboration } from '@/defaults'

const avatarVariants = cva('',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border',
        color: '',
        muted: 'bg-background text-muted-foreground border'
      },
      stacked: {
        true: 'shadow-[-1px_1px_5px_-3px_rgba(0,0,0,0.4)] dark:shadow-none'
      },
      size: {
        sm: 'size-7 mr-2 font-normal text-xs',
        lg: 'size-9 mr-6 font-semibold text-md',
        default: 'size-8 font-semibold text-sm'
      }
    }
  })

export const Avatar = ({ value, variant = 'default', size = 'default', color = 'default', stacked = false, className }:
React.HTMLAttributes<HTMLDivElement> &
VariantProps<typeof avatarVariants> & {
  value: string
  color?: string
  stacked?: boolean
}): JSX.Element => {
  const bg = Collaboration.colors[color]?.bg || ''
  const border = Collaboration.colors[color]?.border || ''

  const compoundClassName = cn(className, variant === 'color' && [bg, 'border', border])

  return (
    <AvatarMain className={cn(avatarVariants({ size, stacked }))}>
      <AvatarFallback
        className={cn(avatarVariants({ variant, className: compoundClassName }))}
      >
        {getInitials(value)}
      </AvatarFallback>
    </AvatarMain >
  )
}
