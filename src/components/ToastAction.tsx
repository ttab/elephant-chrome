import type { JSX } from 'react'
import type { LucideIcon } from '@ttab/elephant-ui/icons'
import type { Target } from '@/components/Link/lib/handleLink'
import type { View } from '@/types'
import { useLink } from '@/hooks/useLink'
import { Button, Tooltip } from '@ttab/elephant-ui'

export const ToastAction = ({ documentId, withView, Icon, label, target = 'last' }: {
  documentId: string | undefined
  withView: View
  label?: string
  Icon?: LucideIcon
  target?: Target
}): JSX.Element | null => {
  const openDocument = useLink(withView)

  if (!documentId) {
    return null
  }

  return (
    <Tooltip content={label}>
      <Button
        variant='icon'
        className='text-muted-foreground'
        onClick={(event) => openDocument(event, { id: documentId }, target)}
      >
        {Icon && <Icon size={16} strokeWidth={1.75} />}
      </Button>
    </Tooltip>
  )
}
