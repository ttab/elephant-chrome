import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { getInitials } from '@/lib/getInitials'

import {
  Avatar as AvatarMain,
  AvatarFallback,
  AvatarImage
} from '@ttab/elephant-ui'
import { type Session } from 'next-auth'

const avatarVariants = cva('cursor-default text-opacity-60',
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
        xxs: 'size-4 mr-1.5 font-semibold text-[9px]',
        xs: 'size-6 mr-1.5 font-semibold text-[11px]',
        sm: 'size-7 text-xs',
        lg: 'size-9 font-semibold text-md',
        xl: 'size-12 font-semibold text-md',
        default: 'size-8 font-semibold text-sm'
      }
    }
  })

export type AvatarSize = 'xxs' | 'xs' | 'sm' | 'lg' | 'xl' | 'default' | undefined | null

export const Avatar = ({ user, value, variant = 'default', size = 'default', color, stacked = false, className }:
  React.HTMLAttributes<HTMLDivElement>
  & VariantProps<typeof avatarVariants> & {
    value?: string
    user?: Session['user'] | undefined
    color?: string | null | undefined
    stacked?: boolean
  }): JSX.Element => {
  const style = color ? { backgroundColor: color } : {} // rgb(x, y, z)
  const compoundClassName = cn(className, variant === 'color' && 'border border-gray')

  return (
    <AvatarMain className={cn(avatarVariants({ size, stacked }))}>
      <AvatarImage src={user?.image} />
      <AvatarFallback
        className={cn(avatarVariants({ variant, className: compoundClassName }))}
        style={style}
      >
        {size !== 'xxs'
          ? getInitials(user?.name || value)
          : (user?.name || value)?.[0]}
      </AvatarFallback>
    </AvatarMain>
  )
}
