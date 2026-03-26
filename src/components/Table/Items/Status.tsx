import { Tooltip } from '@ttab/elephant-ui'
import { CirclePlusIcon, CalendarCheckIcon } from '@ttab/elephant-ui/icons'
import { useMemo, type JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const Status = ({ status }: { status: string }): JSX.Element => {
  const { t } = useTranslation('event')
  return useMemo(() => (
    <div className='flex items-center'>
      <Tooltip content={status ? t('event:tooltips.planningCreated') : t('event:tooltips.createPlanning')}>
        {status
          ? <CalendarCheckIcon color='#FF971E' size={18} strokeWidth={1.75} />
          : <CirclePlusIcon color='#6B6F76' size={18} strokeWidth={1.75} />}
      </Tooltip>
    </div>
  ), [status, t])
}
