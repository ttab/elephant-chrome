import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { getInitials } from '@/lib/getInitials'

import {
  Avatar as AvatarMain,
  AvatarFallback
} from '@ttab/elephant-ui'

const avatarVariants = cva('text-sm',
  {
    variants: {
      variant: {
        menu: 'bg-[#973C9F] border-2 font-semibold text-background dark:text-foreground',
        plan: 'bg-background border-2 text-muted-foreground text-xs',
        table: 'bg-background border-2 text-muted-foreground text-xs'
      },
      size: {
        default: 'size-8',
        sm: 'size-7 mr-2',
        lg: 'size-9 mr-6'
      }
    }
  })

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof avatarVariants> {
  value: string
}

export const Avatar = ({ variant, value, size = 'default', className }: AvatarProps): JSX.Element => (
  <AvatarMain className={cn(avatarVariants({ size }))}>
    <AvatarFallback
      className={cn(avatarVariants({ variant, className }))}
    >
      {getInitials(value)}
    </AvatarFallback>
  </AvatarMain>
)
