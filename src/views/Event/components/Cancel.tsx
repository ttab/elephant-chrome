import type { FormProps } from '@/components/Form/Root'
import { Checkbox, Label } from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Cancel = ({ cancelled, setCancelled, onChange }: {
  cancelled: string | undefined
  setCancelled: (arg: string) => void
} & FormProps) => {
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
      <Label htmlFor='cancelled'>{!isCancelled ? 'Markera som inställd' : 'Evenemanget är markerat som inställt!'}</Label>
    </div>
  ), [isCancelled, setCancelled, onChange])
}
