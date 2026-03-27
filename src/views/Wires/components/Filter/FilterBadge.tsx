import { Badge } from '@ttab/elephant-ui'
import { useTranslation } from 'react-i18next'

export const FilterBadge = ({ labels }: {
  labels: string[]
}) => {
  const { t } = useTranslation()

  if (!Array.isArray(labels) || !labels.length) {
    return
  }

  if (labels.length > 2) {
    return (
      <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
        {labels.length}
        {' '}
        {t('misc.selected')}
      </Badge>
    )
  }


  return labels.map((value: string | number) => {
    return (
      <div key={value}>
        <Badge variant='secondary' className='rounded-sm px-1 font-normal mr-1'>
          {value}
        </Badge>
      </div>
    )
  })
}
