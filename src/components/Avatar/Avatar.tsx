import {
  Avatar as UIAvatar,
  AvatarFallback,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import { cva } from 'class-variance-authority'

import { type PropsWithChildren } from 'react'
import { Collaboration } from '@/defaults'

interface AvatarProps extends PropsWithChildren {
  name: string
  initials: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export function Avatar({ name, initials, color, size = 'sm', children }: AvatarProps): JSX.Element {
  const bg = Collaboration.colors[color || 'default']?.bg || ''
  const border = Collaboration.colors[color || 'default']?.border || ''

  const triggerFallback = cva('font-bold border', {
    variants: {
      size: {
        xs: `text-xs ${bg} ${border}`,
        sm: `text-sm ${bg} ${border}`,
        md: `text-md border-2 ${bg} ${border}`,
        lg: `text-lg border-3 ${bg} ${border}`
      }
    }
  })
  const avatarSize = cva('', {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-9 w-9',
        lg: 'h-10 w-10'
      }
    }
  })

  return (
    <Popover>
      <PopoverTrigger className='-ml-2 last:ml-0'>
        <UIAvatar className={cn(avatarSize({ size }))}>
          <AvatarFallback className={cn(triggerFallback({ size }))}>
            <div className="opacity-50">
              {initials}
            </div>
          </AvatarFallback>
        </UIAvatar>
      </PopoverTrigger>

      <PopoverContent className="w-80" sideOffset={20} align='end' alignOffset={15}>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">{name}</h4>
          {children}
        </div>
      </PopoverContent>
    </Popover>
  )
}
