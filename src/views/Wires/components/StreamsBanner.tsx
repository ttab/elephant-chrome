import type { JSX } from 'react'
import type { Wire } from '@/shared/schemas/wire'
import { WifiOffIcon, TriangleAlertIcon } from '@ttab/elephant-ui/icons'
import { useTranslation } from 'react-i18next'

export const StreamsBanner = ({
  isOnline,
  streamErrorCount,
  selectedWires
}: {
  isOnline: boolean
  streamErrorCount: number
  selectedWires: Wire[]
}): JSX.Element | null => {
  const { t } = useTranslation('wires')

  // Priority: offline > stream errors > selected wires
  if (!isOnline) {
    return (
      <div className='flex items-center gap-2'>
        <WifiOffIcon size={16} strokeWidth={1.75} className='text-muted-foreground shrink-0' />
        <span>{t('banner.offline')}</span>
      </div>
    )
  }

  if (streamErrorCount > 0) {
    return (
      <div className='flex items-center gap-2'>
        <TriangleAlertIcon size={16} strokeWidth={1.75} className='text-muted-foreground shrink-0' />
        <span>{t('banner.streamErrors', { count: streamErrorCount })}</span>
      </div>
    )
  }

  if (selectedWires.length > 0) {
    return (
      <div className='flex flex-col items-center gap-1'>
        <div className='flex flex-row items-center gap-2 justify-items-center text-center'>
          <div className='overflow-hidden truncate max-w-100 min-w-60'>
            {`${selectedWires[0].fields['document.title']?.values[0]}`}
          </div>

          {selectedWires.length > 1 && (
            <span className='inline-block bg-muted px-2 py-0.5 rounded-md text-xs font-medium'>
              +
              {selectedWires.length - 1}
            </span>
          )}
        </div>
        <div className='text-center text-muted-foreground text-xs'>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <span className='bg-muted px-2 py-0.5 rounded-md text-xs font-semibold'>ESC</span>
          <span>{` ${t('stream.deselectHint')}`}</span>
        </div>
      </div>
    )
  }

  return null
}
