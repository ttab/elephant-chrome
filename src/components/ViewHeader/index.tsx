import { type ViewProps } from '@/types'
import { ViewFocus } from './ViewFocus'
import { useNavigation } from '@/hooks'

interface ViewHeaderProps extends ViewProps {
  children?: JSX.Element | JSX.Element[]
}

export const ViewHeader = ({ id, children }: ViewHeaderProps): JSX.Element => {
  const { state } = useNavigation()
  return (
    <header className='relative top-0 group-last:w-[calc(100%-8rem)] flex justify-between'>
      {children}
      {state.content.length > 1 &&
        <ViewFocus id={id} />
      }
    </header>
  )
}
