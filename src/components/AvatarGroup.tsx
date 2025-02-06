import { type PropsWithChildren } from 'react'
import { type VariantProps, cva } from 'class-variance-authority'
import { cn } from '@ttab/elephant-ui/utils'

const avatarGroupVariants = cva('flex items-center contain-layout', {
  variants: {
    size: {
      xxs: '-space-x-3',
      xs: '-space-x-3',
      sm: '-space-x-2',
      lg: '-space-x-2',
      xl: '-space-x-2',
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
