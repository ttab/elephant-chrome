import {
  createContext,
  useReducer,
  useLayoutEffect,
  type PropsWithChildren,
  type Dispatch
} from 'react'
import type { NavigationState, NavigationAction } from '@/types'
import { NavigationActionType } from '@/types'
import { initializeNavigationState } from '@/navigation/lib/initializeNavigationState'

import { useHistory, useResize } from '@/hooks'
import { minimumSpaceRequired, navigationReducer } from '@/navigation/lib'
import { debounce } from '@/lib/debounce'

const initialState = initializeNavigationState()

export const NavigationContext = createContext<{
  state: NavigationState
  dispatch: Dispatch<NavigationAction>
}>({
  state: initialState,
  dispatch: () => {}
})

export const NavigationProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const historyState = useHistory()
  const screenSize = useResize()

  // undefined is for initial state on page load/refresh set state from saved history
  // 'popstate' is for state change on back/forward button, set new state.
  useLayoutEffect(() => {
    if (historyState && (historyState.type === 'popstate')) {
      dispatch({
        type: NavigationActionType.SET,
        active: historyState.id,
        content: historyState.contentState
      })
    }
  }, [historyState])


  // Handle when screen size gets smaller and views don't fit or more views fit
  useLayoutEffect(() => {
    debouncedCalculateView(history, state, dispatch)
    // eslint-disable-next-line
  }, [screenSize])

  return (
    <NavigationContext.Provider value={{ state, dispatch }}>
      {children}
    </NavigationContext.Provider>
  )
}

const debouncedCalculateView = debounce(calculateViews, 40)

function calculateViews(
  history: History,
  state: NavigationState,
  dispatch: Dispatch<NavigationAction>): void {
  let spaceRequired = minimumSpaceRequired(history.state.contentState, state.viewRegistry)
  if (spaceRequired <= 12 && (history.state.contentState || []).length <= (state.content || []).length) {
    return
  }

  // Screen size too small for currently available views, remove overflow
  const content = [...history.state.contentState]
  while (spaceRequired > 12) {
    content.shift()
    spaceRequired = minimumSpaceRequired(content, state.viewRegistry)
  }

  // Get active id, or set it to the leftmost view if the active view was removed
  const activeId = content.find(c => c.id === state.active)?.id || content[0].id

  // Set new state
  dispatch({
    type: NavigationActionType.SET,
    active: activeId,
    content
  })

  // Update current history state
  history.replaceState(
    {
      id: activeId,
      contentState: history.state.contentState
    },
    document.title,
    window.location.href
  )
}
