import { useMemo } from 'react'
import { useNavigation } from '@/hooks'
import { NavigationActionType } from '@/types'
import { cn } from '@ttab/elephant-ui/utils'

export const NavigationWrapper = ({ children, id }:
{ children: JSX.Element, id: string | undefined }): JSX.Element => {
  const { state, dispatch } = useNavigation()

  return useMemo(() => {
    const variants = {
      maximized: 'absolute inset-y-0 left-0 z-10 w-screen h-screen bg-background dark:bg-background basis-full p-2',
      minimized: 'relative group flex-grow basis-full p-2'
    }

    return (
      <section
        onClick={() => {
          if (state.active !== id) {
            dispatch({ type: NavigationActionType.ACTIVE, id })
          }
        }}
        className={state.focus === id
          ? cn(variants.maximized)
          : cn(variants.minimized, state.active === id && 'border-t-green-500 border-t-4')}
      >
        {children}
      </section>
    )
  }, [children, id, state.focus, dispatch, state.active])
}
