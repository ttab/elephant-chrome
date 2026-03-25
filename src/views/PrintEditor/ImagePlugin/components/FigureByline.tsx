import type { TBComponentProps } from '@ttab/textbit'
import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

export const FigureByline = ({ children }: TBComponentProps): JSX.Element => {
  const { t } = useTranslation('common')
  return (
    <div className='p-2 flex rounded-xs text-sm bg-slate-200 dark:bg-slate-800'>
      <label className='grow-0 w-16 opacity-70' contentEditable={false}>{t('misc.figureBylineLabel')}</label>
      <figcaption className='grow'>{children}</figcaption>
    </div>
  )
}
