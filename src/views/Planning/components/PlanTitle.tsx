import { TextBox } from '@/components/ui'


export const PlanTitle = ({ autoFocus }: { autoFocus?: boolean }): JSX.Element | undefined => {
  return (
    <TextBox
      path='root.title'
      placeholder='Planeringsrubrik'
      className='font-bold text-lg leading-6'
      autoFocus={!!autoFocus}
      singleLine={true}
    />
  )
}
