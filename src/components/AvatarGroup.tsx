import { type PropsWithChildren } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'

const avatarGroupVariants = cva('flex items-center', {
  variants: {
    size: {
      sm: '-space-x-3',
      lg: '-space-x-2',
      default: '-space-x-2'
    }
  }
})

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement>, PropsWithChildren,
  VariantProps<typeof avatarGroupVariants> {
}

export function AvatarGroup({ children, size = 'default' }: AvatarGroupProps): JSX.Element {
  return (
    <div className={cn(avatarGroupVariants({ size }))}>
      {children}
    </div>
  )
}
