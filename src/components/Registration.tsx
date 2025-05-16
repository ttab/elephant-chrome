import { Key } from '@ttab/elephant-ui/icons'
import { TextBox } from './ui'
import type { FormProps } from './Form/Root'

export const Registration = ({ onChange }: FormProps): JSX.Element => {
  return (
    <TextBox
      path='meta.core/event[0].data.registration'
      icon={<Key size={18} strokeWidth={1.75} className='text-muted-foreground mr-4' />}
      placeholder='Ackreditering'
      className='text-sm'
      onChange={onChange}
    />
  )
}
