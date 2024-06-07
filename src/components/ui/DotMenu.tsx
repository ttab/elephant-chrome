import React, { type MouseEvent } from 'react'
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

interface DotDropdownMenuActionItem {
  label: string
  icon?: LucideIcon
  item: DotDropdownMenuActionItem[] | (<T extends HTMLElement>(event: MouseEvent<T>) => void) | React.ReactNode
}

/**
 * Simpler way to create a drop down menu. Supports multilevel. Items can be React node or callback or sub items.
 *
 * @todo Expand to also allow icon in conjunction with label
 *
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
  const hasIcons = items.findIndex(item => !!item.icon) !== -1

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className="flex h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-accent2">
          {trigger === 'horizontal'
            ? <MoreHorizontal size={18} strokeWidth={1.75} />
            : <MoreVertical size={18} strokeWidth={1.75} />
          }
        </Button>
      </DropdownMenuTrigger>


      <DropdownMenuContent className='w-56'>
        {items.map(item => {
          return <DotDropdownMenuItem key={item.label} item={item} hasIcons={hasIcons} />
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


function DotDropdownMenuItem({ item, hasIcons }: {
  item: DotDropdownMenuActionItem
  hasIcons: boolean
}): JSX.Element {
  const { label, item: Item } = item

  if (!Array.isArray(Item)) {
    return (
      <DropdownMenuItem onClick={<T extends HTMLElement>(evt: MouseEvent<T>) => {
        if (typeof Item === 'function') {
          evt.preventDefault()
          Item(evt)
        }
      }}>
        <DotDropdownMenuItemContent item={item} hasIcons={hasIcons} />
      </DropdownMenuItem>
    )
  }

  const subMenuHasIcons = typeof Item.findIndex(item => item.icon) === 'number'

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {Item.map(item => {
          return <DotDropdownMenuItem key={item.label} item={item} hasIcons={subMenuHasIcons} />
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}


function DotDropdownMenuItemContent({ item, hasIcons }: {
  item: DotDropdownMenuActionItem
  hasIcons: boolean
}): JSX.Element {
  const { label, icon: Icon, item: Item } = item

  return (
    <div className="flex flex-row justify-center items-center">
      {hasIcons &&
        <div className="opacity-70 flex-none w-7">
          {!!Icon &&
            <Icon size={16} strokeWidth={1.75} />
          }
        </div>
      }

      <div className="grow">
        {React.isValidElement(Item)
          ? <>{Item}</>
          : <>{label}</>
        }
      </div>
    </div>
  )
}
