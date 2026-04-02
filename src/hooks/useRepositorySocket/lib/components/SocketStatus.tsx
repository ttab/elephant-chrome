import type { SocketStatus as SocketStatusMessage } from '@/shared/RepositorySocket'
import type { TranslationKey } from '@/types/i18next'
import { Alert } from '@ttab/elephant-ui'
import { cn } from '@ttab/elephant-ui/utils'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const SocketStatus = ({ status }: {
  status: SocketStatusMessage | null
}): JSX.Element | null => {
  const { t } = useTranslation('errors')

  return status && (
    <Alert
      variant={status.error && 'destructive'}
      className={cn('p-4 text-sm rounded', !status.error && 'bg-yellow-100 text-yellow-800')}
    >
      {t(status.message as TranslationKey, status.params ?? {})}
      {' '}
      {t('socket.notRealtime')}
    </Alert>
  )
}
