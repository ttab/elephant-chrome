import { Link } from '..'
import { MoreHorizontalIcon } from '@ttab/elephant-ui/icons'
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
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const ActionMenu = ({ deliverableUuids, planningId }: { deliverableUuids: string[], planningId: string }): JSX.Element => {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-accent2'
        >
          <MoreHorizontalIcon size={18} strokeWidth={1.75} />
          <span className='sr-only'>{t('common:actions.open')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuItem>
          <Link to='Planning' props={{ id: planningId }}>
            {t('common:actions.open')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{t('app:mainMenu.assignments')}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {deliverableUuids.length
              ? deliverableUuids.map((uuid) => {
                return (
                  <DropdownMenuItem key={uuid}>
                    <Link to='Editor' props={{ id: uuid }}>
                      {uuid}
                    </Link>
                  </DropdownMenuItem>
                )
              })
              : t('errors:messages.noDeliverables')}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
