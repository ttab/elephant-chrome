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
  /* DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger, */
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

interface DotDropdownMenuActionItem {
  label: string
  icon?: LucideIcon
  item: DotDropdownMenuActionItem[] | ((event: MouseEvent<HTMLDivElement>) => void) | React.ReactNode
}

/**
 * Simpler way to create a drop down menu. Supports multilevel. Items can be React node or callback.
 *
 * @todo Support multilevel
 * @example
 * <DotMenu trigger="vertical" items={[
 *   {
 *     label: '"Close all",
 *     () => { ... }
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
              asChild
              key={item.label}
            >

              {React.isValidElement(item.item)
                ? item.item
                : (
                    <div
                      className='flex flex-row justify-center items-center'
                      onClick={(event) => {
                        if (typeof item.item === 'function') {
                          item.item(event)
                        }
                      }}
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
