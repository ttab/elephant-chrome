import { TextBox } from '@/components/ui'


export const PlanTitle = ({ autoFocus }: { autoFocus?: boolean }): JSX.Element | undefined => {
  return (
    <div className='flex w-full -ml-1' >
      <TextBox
        base='root'
        path=''
        field='title'
        placeholder='Planeringsrubrik'
        className='font-semibold text-xl leading-4 px-0'
        autoFocus={!!autoFocus}
      />
    </div>
  )
}
