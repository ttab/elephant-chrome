import { Button } from '@ttab/elephant-ui'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import { XIcon } from '@ttab/elephant-ui/icons'

export const ViewDialogClose = ({ onClick, Icon = XIcon }: {
  Icon?: LucideIcon
  onClick: () => void
}): JSX.Element => {
  return (
    <Button
      variant='ghost'
      className='w-9 h-9 p-0 hover:bg-gray-200 dark:hover:bg-gray-100'
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={1.75} />
    </Button>
  )
}
