import { TextBox } from '@/components/ui'

export const PlanTitle = (): JSX.Element | undefined => {
  return (
    <div className='flex w-full -ml-1' >
      <TextBox
        name="title"
        placeholder="Planeringsrubrik"
        className="font-semibold text-xl leading-4 px-0"
      />
    </div>
  )
}
