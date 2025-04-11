import type { MouseEvent } from 'react'
import React from 'react'
import {
  type LucideIcon,
  MoreHorizontal,
  MoreVertical
} from '@ttab/elephant-ui/icons'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

interface DotDropdownMenuActionItem {
  label: string
  icon?: LucideIcon
  item: DotDropdownMenuActionItem[] | ((event: MouseEvent<HTMLDivElement>) => void) | React.ReactNode
  disabled?: boolean
}

/**
 * Simpler way to create a drop down menu. Items can be React node or callback.
 *
 * @example
 * <DotMenu trigger="vertical" items={[
 *   {
 *     disabled: true,
 *     label: '"Close all",
 *     item: () => { ... }
 *   },
 *   {
 *     label: 'Open',
 *     item: [
 *       {
 *          label: 'Document 1',
 *          <Link .../>
 *       },
 *       {
 *          label: 'Document 2',
 *          <Link .../>
 *       }
 *     ]
 *   }
 * ]} />
 */
export const DotDropdownMenu = ({ trigger = 'horizontal', items }: {
  trigger?: 'horizontal' | 'vertical'
  items: DotDropdownMenuActionItem[]
}): JSX.Element => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-accent2'>
          {trigger === 'horizontal'
            ? <MoreHorizontal size={18} strokeWidth={1.75} />
            : <MoreVertical size={18} strokeWidth={1.75} />}
        </Button>
      </DropdownMenuTrigger>


      <DropdownMenuContent className='w-56'>
        {items.map((item) => {
          return (
            <DropdownMenuItem
              disabled={item.disabled}
              key={item.label}
              onClick={(event) => {
                event.stopPropagation()
                event.preventDefault()
                if (typeof item.item === 'function') {
                  item.item(event)
                }
              }}
            >

              {React.isValidElement(item.item)
                ? item.item
                : (
                    <div
                      className='flex flex-row justify-center items-center'
                    >
                      <div className='opacity-70 flex-none w-7'>
                        {item.icon && <item.icon size={16} strokeWidth={1.75} />}
                      </div>

                      <div className='grow'>
                        {item.label}
                      </div>
                    </div>
                  )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
