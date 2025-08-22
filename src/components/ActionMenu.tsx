import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { MoreHorizontal } from '@ttab/elephant-ui/icons'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

import { Link } from '@/components/index'
import type { View } from '../types'

export const ActionMenu = ({ actions }: {
  actions: Array<{
    to?: View
    id?: string
    icon: LucideIcon
    title: string
    onClick?: () => void
    disabled?: boolean
  }>
}): JSX.Element => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-accent2'
          onClickCapture={(e) => e.preventDefault()}
        >
          <MoreHorizontal size={18} strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-56'>
        {actions.map((action) => {
          return (
            <ActionItem action={action} key={action.title} />
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ActionItem = ({ action }: {
  action: {
    title: string
    icon: LucideIcon
    to?: View
    id?: string
    onClick?: () => void
    disabled?: boolean
  }
}): JSX.Element | null => {
  return (
    <DropdownMenuItem
      asChild
      disabled={action.disabled}
      onClick={(event) => {
        if (action.onClick) {
          event.stopPropagation()
          action.onClick()
        }
      }}
    >
      {action.to
        ? (
            <Link to={action.to} target='last' props={{ id: action.id }} className='flex flex-row gap-5'>
              <div className='pt-1'>
                <action.icon size={14} strokeWidth={1.5} className='shrink' />
              </div>
              <div className='grow'>{action.title}</div>
            </Link>
          )
        : action.onClick
          ? (
              <div className='flex flex-row gap-5'>
                <div className='pt-1'>
                  <action.icon size={14} strokeWidth={1.5} className='shrink' />
                </div>
                <div className='grow'>{action.title}</div>
              </div>
            )
          : null}
    </DropdownMenuItem>
  )
}
