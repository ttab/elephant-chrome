import { Checkbox, Label } from '@ttab/elephant-ui'
import { useMemo } from 'react'

export const Cancel = ({ cancelled, setCancelled }: { cancelled: boolean | undefined, setCancelled: (arg: boolean) => void }) => {
  return useMemo(() => (
    <div className='flex items-center gap-2 relative'>
      <span className='my-0 mr-4 invisible'>x</span>
      <Checkbox
        id='cancelled'
        className='ml-2'
        defaultChecked={cancelled}
        checked={cancelled}
        onCheckedChange={() => {
          setCancelled(!cancelled)
        }}
      />
      <Label htmlFor='cancelled'>Markera som inställd</Label>
    </div>
  ), [cancelled, setCancelled])
}
