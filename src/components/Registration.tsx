import { Key } from '@ttab/elephant-ui/icons'
import { TextBox } from './ui'

export const Registration = (): JSX.Element => {
  return (
    <TextBox
      path='meta.core/event[0].data.registration'
      icon={<Key size={20} strokeWidth={1.75} className='text-muted-foreground' />}
      placeholder='Ackreditering'
      className='text-sm'
    />
  )
}
