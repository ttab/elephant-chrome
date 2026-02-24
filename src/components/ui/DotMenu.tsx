import React, { useRef, useState } from 'react'
import type { MouseEvent, JSX } from 'react'
import {
  type LucideIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon
} from '@ttab/elephant-ui/icons'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

export interface DotDropdownMenuActionItem {
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
const MENU_WIDTH = 224 // w-56 = 14rem = 224px

export const DotMenu = ({ trigger = 'horizontal', items }: {
  trigger?: 'horizontal' | 'vertical'
  items: DotDropdownMenuActionItem[]
}): JSX.Element => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [align, setAlign] = useState<'start' | 'end'>('start')

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (open && triggerRef.current) {
        const spaceRight = window.innerWidth - triggerRef.current.getBoundingClientRect().left
        setAlign(spaceRight >= MENU_WIDTH ? 'start' : 'end')
      }
    }}
    >
      <DropdownMenuTrigger asChild>
        <Button ref={triggerRef} variant='ghost' className='flex h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-gray-200 dark:hover:bg-table-focused'>
          {trigger === 'horizontal'
            ? <MoreHorizontalIcon size={18} strokeWidth={1.75} />
            : <MoreVerticalIcon size={18} strokeWidth={1.75} />}
        </Button>
      </DropdownMenuTrigger>


      <DropdownMenuContent align={align} className='w-56'>
        {items.map((item) => {
          if (Array.isArray(item.item)) {
            return (
              <DropdownMenuSub key={item.label}>
                <DropdownMenuSubTrigger disabled={item.disabled}>
                  {item.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {item.item.length
                    ? item.item.map((subItem) => (
                      <DropdownMenuItem
                        key={subItem.label}
                        disabled={subItem.disabled}
                        onClick={(event) => {
                          event.stopPropagation()
                          if (typeof subItem.item === 'function') {
                            subItem.item(event)
                          }
                        }}
                      >
                        {React.isValidElement(subItem.item)
                          ? subItem.item
                          : subItem.label}
                      </DropdownMenuItem>
                    ))
                    : <DropdownMenuItem disabled>{item.label}</DropdownMenuItem>}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )
          }

          return (
            <DropdownMenuItem
              disabled={item.disabled}
              key={item.label}
              onClick={(event) => {
                event.stopPropagation()
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
