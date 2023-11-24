import {
  createContext,
  useReducer,
  useLayoutEffect,
  type PropsWithChildren,
  type Dispatch
} from 'react'
import type { NavigationState, NavigationAction } from '@/types'
import { NavigationActionType } from '@/types'
import { init } from '@/lib/init'

import { useHistory } from '@/hooks'
import { navigationReducer } from '@/navigation/lib'


const initialState = init()

export const NavigationContext = createContext<{
  state: NavigationState
  dispatch: Dispatch<NavigationAction>
}>({ state: initialState, dispatch: () => { } })

export const NavigationProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const historyState = useHistory()

  useLayoutEffect(() => {
    // Create history state for initial content based on url
    if (historyState === null) {
      // TODO: Make router/location hook
      const currentView = window.location.pathname !== '/'
        ? window.location.pathname[1].toUpperCase() + window.location.pathname.slice(2)
        : 'PlanningOverview'
      const currentProps = Object.fromEntries(new URLSearchParams(window.location.search))
      const id = currentProps.id || 'start'

      history.replaceState({
        id,
        itemName: currentView,
        contentState: [{ id, name: currentView, props: currentProps, path: '/' }]
      }, document.title, window.location.href)
    }

    /* undefined is for initial state on page load/refresh set state from saved history
       'popstate' is for state change on back/forward button, set new state */
    if (historyState && (historyState.type === 'popstate' || historyState.type === undefined)) {
      dispatch({ type: NavigationActionType.SET, content: historyState.contentState })
    }
  }, [historyState])

  // Remove first element if document width exceeds window width
  useLayoutEffect(() => {
    if (document.documentElement.scrollWidth > window.innerWidth) {
      // Remove overflowing view and update state
      dispatch({ type: NavigationActionType.REMOVE })
      // Set new history.state
      history.replaceState({
        contentState: history.state.contentState.slice(1, history.state.contentState.length)
      }, document.title, window.location.href)
    }
  }, [state])

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  )
}

