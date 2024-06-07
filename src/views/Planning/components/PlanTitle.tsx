import { TextBox } from '@/components/ui'


export const PlanTitle = ({ autoFocus }: { autoFocus?: boolean }): JSX.Element | undefined => {
  return (
    <TextBox
      base='root'
      path=''
      field='title'
      placeholder='Planeringsrubrik'
      className='font-bold text-lg leading-6'
      autoFocus={!!autoFocus}
      singleLine={true}
    />
  )
}
