import { type ViewProps } from '@/types'
import { ViewFocus } from './ViewFocus'

interface ViewHeaderProps extends ViewProps {
  title: string
}

export const ViewHeader = ({ title, id }: ViewHeaderProps): JSX.Element => {
  return (
    <header className='relative top-0 group-last:w-[calc(100%-8rem)] flex justify-between'>
      <h1 className='font-bold text-2xl mb-8 break-all'>{title}</h1>
      <ViewFocus id={id} />
    </header>
  )
}
