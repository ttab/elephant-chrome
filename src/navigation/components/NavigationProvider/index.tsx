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
import { minimumSpaceRequired } from '@/navigation/lib/minimumSpaceRequired'

const initialState = initializeNavigationState()

export const NavigationContext = createContext<{
  state: NavigationState
  dispatch: Dispatch<NavigationAction>
}>({
  state: initialState,
  dispatch: () => { }
})

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


  // Handle when screen size gets smaller and views don't fit no longer
  useLayoutEffect(() => {
    let spaceRequired = minimumSpaceRequired(history.state.contentState, state.viewRegistry, state.screens)
    if (spaceRequired <= 12) {
      return
    }

    // Screen size too small for currently displayed views, remove overflow
    const content = history.state.contentState
    do {
      content.shift()
      spaceRequired = minimumSpaceRequired(history.state.contentState, state.viewRegistry, state.screens)
    } while (spaceRequired > 12)

    // Set new state
    dispatch({
      type: NavigationActionType.SET,
      content
    })

    // Update current history state, not adding, this does however make it
    // difficult/impossible to redisplay removed views if screen gets bigger...
    history.replaceState(
      {
        contentState: content
      },
      document.title,
      window.location.href
    )
  }, [screenSize, state])

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  )
}
