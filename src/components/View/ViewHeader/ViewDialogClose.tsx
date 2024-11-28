import { Button } from '@ttab/elephant-ui'
import { LucideIcon, XIcon } from '@ttab/elephant-ui/icons'

export const ViewDialogClose = ({ onClick, Icon = XIcon }: {
  Icon?: LucideIcon
  onClick: () => void
}): JSX.Element => {
  return (
    <Button
      variant='ghost'
      className='w-9 px-0'
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={1.75} />
    </Button>
  )
}
