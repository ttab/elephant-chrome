import { Label, Switch } from '@ttab/elephant-ui'
import { CheckCircle, CircleX } from '@ttab/elephant-ui/icons'
import { useMemo } from 'react'

export const Cancel = ({ cancelled, setCancelled }: { cancelled: boolean | undefined, setCancelled: (arg: boolean) => void }) => {
  const CancelledMarker = cancelled ? CircleX : CheckCircle

  return useMemo(() => (
    <div className='flex items-center gap-2'>
      <Switch
        id='cancelSwitch'
        onCheckedChange={() => {
          setCancelled(!cancelled)
        }}
        checked={(!cancelled)}
        className=''
      />
      <CancelledMarker
        size={20}
        color='#ffffff'
        strokeWidth={1.75}
        fill={!cancelled ? '#008000' : '#ff0000'}
        className={`rounded-full bg-[${!cancelled ? '#008000' : '#ff0000'}]`}
      />
      <Label htmlFor='cancelSwitch'>{!cancelled ? 'Markera som inställd' : 'Händelsen är markerad som inställd'}</Label>
    </div>
  ), [CancelledMarker, cancelled, setCancelled])
}
