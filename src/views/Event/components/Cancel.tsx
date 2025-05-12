import { Checkbox, Label } from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Cancel = ({ cancelled, setCancelled }: { cancelled: boolean | undefined, setCancelled: (arg: boolean) => void }) => {
  const isCancelled = typeof cancelled === 'string' ? cancelled === 'true' ? true : false : cancelled
  return useMemo(() => (
    <div className='flex items-center gap-2'>
      <span className='my-0 mr-4 invisible'>x</span>
      <Checkbox
        id='cancelled'
        className='ml-2'
        checked={isCancelled}
        onCheckedChange={(checked: boolean) => {
          setCancelled(checked)
        }}
      />
      <Label htmlFor='cancelled'>{!isCancelled ? 'Markera som inställd' : 'Evenemanget är markerat som inställt!'}</Label>
    </div>
  ), [cancelled, setCancelled])
}
