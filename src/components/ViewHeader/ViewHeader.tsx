import { type ViewProps } from '@/types'
import { ViewFocus } from './ViewFocus'
import { useNavigation } from '@/hooks'
import { type LucideIcon } from '@ttab/elephant-ui/icons'

interface ViewHeaderProps extends ViewProps {
  title: string
  icon?: LucideIcon
  children?: JSX.Element | JSX.Element[]
}

export const ViewHeader = ({ id, children, title, icon: Icon }: ViewHeaderProps): JSX.Element => {
  const { state } = useNavigation()

  return (
    <header className='relative top-0 group-last:w-[calc(100%-8rem)] flex gap-3 border-b py-2 px-3 items-center justify-between'>
      <div className="flex h-full gap-3 items-center">
        {Icon !== undefined &&
          <Icon className="h-4 w-4 -mt-[2px]" />
        }

        <h2 className="font-bold -ml-1 mr-3">
          {title}
        </h2>

        {children}
      </div>

      <div className="flex h-full gap-3 items-center">
        {state.content.length > 1 &&
          <ViewFocus id={id} />
        }
      </div>
    </header>
  )
}
