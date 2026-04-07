import type { TranslationKey } from '@/types/i18next'
import { useSocketStatus } from '@/hooks/useSocketStatus'
import { WifiOffIcon, TriangleAlertIcon, LoaderIcon } from '@ttab/elephant-ui/icons'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

const iconByLevel = {
  info: <LoaderIcon size={16} strokeWidth={1.75} className='text-muted-foreground shrink-0 animate-spin' />,
  warning: <WifiOffIcon size={16} strokeWidth={1.75} className='text-muted-foreground shrink-0' />,
  error: <TriangleAlertIcon size={16} strokeWidth={1.75} className='text-muted-foreground shrink-0' />
}

export const SocketBanner = (): JSX.Element | null => {
  const status = useSocketStatus()
  const { t } = useTranslation('errors')

  if (!status) return null

  return (
    <div className='flex items-center gap-2'>
      {iconByLevel[status.level]}
      <span>
        {t(status.message as TranslationKey, status.params ?? {})}
        {' '}
        {t('socket.notRealtime')}
      </span>
    </div>
  )
}
