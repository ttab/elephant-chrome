import type { SocketStatus as SocketStatusMessage } from '@/shared/RepositorySocket'
import { Alert } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import type { JSX } from 'react'

export const SocketStatus = ({ status }: {
  status: SocketStatusMessage | null
}): JSX.Element | null => {
  return status && (
    <Alert
      variant={status.error && 'destructive'}
      className={cn('p-4 text-sm rounded', !status.error && 'bg-yellow-100 text-yellow-800')}
    >
      {status.message + ' Vyn uppdateras inte i realtid...'}
    </Alert>
  )
}
