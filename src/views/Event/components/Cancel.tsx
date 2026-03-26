import type { FormProps } from '@/components/Form/Root'
import { Checkbox, Label } from '@ttab/elephant-ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export const Cancel = ({ cancelled, setCancelled, onChange }: {
  cancelled: string | undefined
  setCancelled: (arg: string) => void
} & FormProps) => {
  const { t } = useTranslation()
  const isCancelled = typeof cancelled === 'string' ? cancelled === 'true' ? true : false : cancelled
  return useMemo(() => (
    <div className='flex items-center gap-2'>
      <span className='my-0 mr-4 invisible'>x</span>
      <Checkbox
        id='cancelled'
        className='ml-2'
        checked={!!isCancelled}
        onCheckedChange={(checked: boolean) => {
          onChange?.(true)
          if (checked) {
            setCancelled('true')
          } else {
            setCancelled('false')
          }
        }}
      />
      <Label htmlFor='cancelled'>{!isCancelled ? t('event:labels.markAsCancelled') : t('event:labels.markedAsCancelled')}</Label>
    </div>
  ), [isCancelled, setCancelled, onChange, t])
}
