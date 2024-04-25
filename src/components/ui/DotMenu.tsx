import React from 'react'
import { MoreHorizontal, MoreVertical } from '@ttab/elephant-ui/icons'
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
  item: DotDropdownMenuActionItem[] | ((evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => void) | React.ReactNode
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          {trigger === 'horizontal'
            ? <MoreHorizontal size={18} strokeWidth={1.75} />
            : <MoreVertical size={18} strokeWidth={1.75} />
          }
        </Button>
      </DropdownMenuTrigger>


      <DropdownMenuContent className='w-56'>
        {items.map(item => {
          return <DotDropdownMenuItem key={item.label} item={item} />
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DotDropdownMenuItem({ item }: {
  item: DotDropdownMenuActionItem
}): JSX.Element {
  const { label, item: Item } = item

  if (!Array.isArray(Item)) {
    return (
      <DropdownMenuItem onClick={(evt) => {
        if (typeof Item === 'function') {
          evt.preventDefault()
          Item(evt)
        }
      }}>
        {React.isValidElement(Item)
          ? <>{Item}</>
          : <>{label}</>
        }
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {Item.map(item => {
          return <DotDropdownMenuItem key={item.label} item={item} />
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
