import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { type PropsWithChildren } from 'react'

export const Title = ({ title, short: shortTitle, icon: Icon }: PropsWithChildren &
{
  title: string
  short?: string
  icon: LucideIcon
}
): JSX.Element => {
  return (
    <div
      className="flex flex-1 gap-2 items-center grow-0 h-14 px-4 cursor-pointer"
    >
      {!!Icon &&
        <Icon size={18} strokeWidth={1.75} />
      }

      {!!title &&
        <h2 className="font-bold cursor-pointer whitespace-nowrap">
          {typeof shortTitle !== 'string'
            ? <>{title}</>
            : <>
              <span className="@3xl/view:hidden">{shortTitle}</span>
              <span className="hidden @3xl/view:inline">{title}</span>
            </>
          }
        </h2>
      }
    </div>
  )
}
