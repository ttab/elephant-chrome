import { Pen, CalendarDaysIcon, MoreHorizontal } from '@ttab/elephant-ui/icons'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ttab/elephant-ui'

import { Link } from '@/components/index'

export const ActionMenu = ({ actions }: {
  actions: Array<{
    to: 'Planning' | 'Editor'
    id: string
    title: string
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
        {actions.map(({ to, id, title }) => {
          const Icon = (to === 'Planning') ? CalendarDaysIcon : Pen

          return (
            <DropdownMenuItem key={id}>
              <Link to={to} target='last' props={{ id }} className='flex flex-row gap-5'>
                <div className='pt-1'>
                  <Icon size={14} strokeWidth={1.5} className='shrink' />
                </div>
                <div className='grow'>{title}</div>
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
