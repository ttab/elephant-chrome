import { Button } from '@ttab/elephant-ui'
import { XIcon } from '@ttab/elephant-ui/icons'

export const ViewDialogClose = ({ onClick }: {
  onClick: () => void
}): JSX.Element => {
  return (
    <Button
      variant='ghost'
      className='w-9 px-0'
      onClick={onClick}
    >
      <XIcon size={18} strokeWidth={1.75} />
    </Button>
  )
}
