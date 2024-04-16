import { type LucideIcon } from '@ttab/elephant-ui/icons'
import { useEffect, type PropsWithChildren } from 'react'
import { handleReset } from '@/components/Link/lib/handleReset'
import { useNavigation, useView } from '@/hooks'

export const Title = ({ title, short: shortTitle, icon: Icon }: PropsWithChildren &
{
  title: string
  short?: string
  icon: LucideIcon
}
): JSX.Element => {
  const { state, dispatch } = useNavigation()
  const { viewId, isActive } = useView()

  useEffect(() => {
    // Only add event listener if the view is active
    if (isActive) {
      const keyDownHandler = (evt: KeyboardEvent): void => {
        if (evt.altKey && evt.shiftKey && /^Digit\d$/.test(evt.code)) {
          try {
            const viewIndex = parseInt(evt.code.slice(-1)) - 1
            const viewId = state.content[viewIndex].key


            if (viewId) {
              handleReset({ viewId, dispatch })
            }
          } catch {
            console.warn('Invalid view index')
          }
        }
      }

      document.addEventListener('keydown', keyDownHandler)

      return () => {
        document.removeEventListener('keydown', keyDownHandler)
      }
    }
  }, [state, dispatch, isActive])

  return (
    <div
      className="flex flex-1 gap-2 items-center grow-0 h-14 cursor-pointer"
      onClick={() => handleReset({ viewId, dispatch })}
    >
      {!!Icon &&
        <Icon size={18} strokeWidth={1.75} />
      }

      {!!title &&
        <h2 className="font-bold cursor-pointer">
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
