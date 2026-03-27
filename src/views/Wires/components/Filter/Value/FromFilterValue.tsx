import { CalendarIcon } from 'lucide-react'
import { FilterBadge } from '../FilterBadge'
import { useTranslation } from 'react-i18next'

export const FromFilterValue = ({ values }: {
  values: string[]
}) => {
  const { t } = useTranslation()

  return (
    <>
      <CalendarIcon size={18} strokeWidth={1.75} className='mr-2' />
      <span className='text-xs'>{t('common:misc.since')}</span>
      <FilterBadge labels={values} />
    </>
  )
}
