import {
  createContext,
  useReducer,
  useLayoutEffect,
  type PropsWithChildren,
  type Dispatch
} from 'react'
import type { NavigationState, NavigationAction } from '@/types'
import { NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/lib/initializeNavigationState'

import { useHistory, useResize, useView } from '@/hooks'
import { navigationReducer } from '@/navigation/lib'

const initialState = initializeNavigationState()

export const NavigationContext = createContext<{
  state: NavigationState
  dispatch: Dispatch<NavigationAction>
}>({ state: initialState, dispatch: () => { } })

export const NavigationProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const historyState = useHistory()
  const screenSize = useResize()
  const { name, props } = useView()

  // Initialize a new history start state based on current url
  useLayoutEffect(() => {
    if (historyState === null) {
      history.replaceState({
        id: 'start',
        itemName: name,
        contentState: [{
          id: 'start',
          name,
          props,
          path: '/'
        }]
      }, document.title, window.location.href)
    }
  }, [name, props, historyState])


  // undefined is for initial state on page load/refresh set state from saved history
  // 'popstate' is for state change on back/forward button, set new state.
  useLayoutEffect(() => {
    if (historyState && (historyState.type === 'popstate' || historyState.type === undefined)) {
      dispatch({
        type: NavigationActionType.SET,
        content: historyState.contentState
      })
    }
  }, [historyState])


  // FIXME: Calculate widths and things for all views currently displayed
  // Remove first element if document width exceeds window width
  useLayoutEffect(() => {
    if (document.documentElement.scrollWidth <= window.innerWidth) {
      return
    }

    // Remove overflowing view and update state
    dispatch({ type: NavigationActionType.REMOVE })

    history.replaceState({
      contentState: history.state.contentState.slice(1, history.state.contentState.length)
    }, document.title, window.location.href)
  }, [state, screenSize])

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  )
}
