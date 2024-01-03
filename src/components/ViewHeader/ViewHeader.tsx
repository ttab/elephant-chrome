import { type ViewProps } from '@/types'
import { ViewFocus } from './ViewFocus'
import { useNavigation } from '@/hooks'
import { type LucideIcon } from '@ttab/elephant-ui/icons'

interface ViewHeaderProps extends ViewProps {
  title: string
  shortTitle?: string
  icon?: LucideIcon
  children?: JSX.Element | JSX.Element[]
}

export const ViewHeader = ({ id, children, title, shortTitle, icon: Icon }: ViewHeaderProps): JSX.Element => {
  const { state } = useNavigation()

  return (
    <header className='sticky top-0 group-last:w-[calc(100%-5rem)] h-14 flex gap-3 border-b py-2 px-3 items-center justify-between bg-background z-50'>
      <div className="flex h-full gap-3 items-center">
        {Icon !== undefined &&
          <Icon className="h-4 w-4 -mt-[2px]" />
        }

        <h2 className="font-bold -ml-1 mr-3">
          {typeof shortTitle !== 'string'
            ? <>{title}</>
            : <>
              <span className="@3xl/view:hidden">{shortTitle}</span>
              <span className="hidden @3xl/view:inline">{title}</span>
            </>
          }
        </h2>

        {children}
      </div>

      <div className="flex h-full gap-3 items-center">
        {state.content.length > 1 &&
          <ViewFocus id={id} />
        }
      </div>
    </header >
  )
}
