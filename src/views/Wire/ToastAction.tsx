import type { Target } from '@/components/Link/lib/handleLink'
import { useLink } from '@/hooks/useLink'
import type { View } from '@/types/index'
import { Button, Tooltip } from '@ttab/elephant-ui'
import type { LucideIcon } from '@ttab/elephant-ui/icons'

export const ToastAction = ({ documentId, withView, Icon, label, target }: {
  documentId: string | undefined
  withView: View
  label?: string
  Icon?: LucideIcon
  target?: Target
}): JSX.Element | null => {
  const open = useLink(withView)

  if (!documentId) {
    return null
  }

  return (
    <div className='flex flex-row w-full gap-2 justify-end'>
      <Tooltip
        content={label}
      >
        <Button
          variant='icon'
          onClick={(event) =>
            open(event, { id: documentId }, target)}
        >
          {Icon && <Icon size={16} strokeWidth={1.75} />}
        </Button>
      </Tooltip>
    </div>
  )
}
