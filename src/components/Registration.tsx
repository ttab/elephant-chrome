import { TextBox } from './ui'

export const Registration = (): JSX.Element => {
  return (
    <TextBox
      path='meta.core/event.data.registration'
      placeholder='Ackreditering'
      className='font-bold text-lg leading-6'
      singleLine={true}
    />
  )
}
