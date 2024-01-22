import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'
import { getInitials } from '@/lib/getInitials'

const avatarVariants = cva('flex rounded-full items-center justify-center bg-background text-muted-foreground border',
  {
    variants: {
      size: {
        default: 'h-8 w-8',
        sm: 'h-7 w-7 mr-2 text-xs',
        lg: 'h-9 w-9 mr-6'
      }
    }
  })

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof avatarVariants> {
  value: string
}

export const Avatar = ({ value, size = 'default', className }: AvatarProps): JSX.Element => (
  <div className={cn(avatarVariants({ size, className })
  )}>
    {getInitials(value)}
  </div>
)
