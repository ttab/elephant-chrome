import {
  createContext,
  useReducer,
  useLayoutEffect,
  type PropsWithChildren,
  type Dispatch
} from 'react'
import { NavigationWrapper } from '@/components/NavigationWrapper'
import type { ContentState, NavigationState, NavigationAction } from '@/types'
import { NavigationActionType } from '@/types'

import { useHistory } from '@/hooks'

export const NavigationContext = createContext<{
  state: NavigationState | null
  dispatch: Dispatch<NavigationAction>
}>({ state: null, dispatch: () => {} })

export const NavigationProvider = ({ children, init }: PropsWithChildren<{ init: () => NavigationState }>): JSX.Element => {
  const [state, dispatch] = useReducer(navigationReducer, null, init)
  const historyState = useHistory()

  useLayoutEffect(() => {
    // Create history state for initial content
    if (historyState === null) {
      const currentView = window.location.pathname !== '/' ? window.location.pathname[1].toUpperCase() + window.location.pathname.slice(2) : 'Init'
      const currentProps = Object.fromEntries(new URLSearchParams(window.location.search))
      const id = currentProps.id || 'init'
      history.replaceState({
        id,
        itemName: currentView,
        contentState: [{ id, name: currentView, props: currentProps }]
      },
      document.title,
      window.location.href
      )
    }
    if (historyState !== null) {
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

function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case NavigationActionType.ADD:
      console.log('ADDing view')
      if (action.component === undefined || action.props === undefined) {
        throw new Error('Component is undefined')
      }
      return {
        ...state,
        content: [
          ...state.content,
          <NavigationWrapper key={action.id}>
            <action.component { ...action.props }/>
          </NavigationWrapper>

        ]
      }
    case NavigationActionType.REMOVE:
      console.log('ADD side effect REMOVE')
      return {
        ...state,
        content: [
          ...state.content.slice(1, state.content.length)
        ]
      }
    case NavigationActionType.SET:
      if (action.content === undefined) {
        throw new Error('Content is undefined')
      }

      console.log('ADD side effect SET')
      return {
        ...state,
        content: action.content.map((item: ContentState): JSX.Element => {
          const Component = state.registry.get(item.name)?.component
          return (
            <NavigationWrapper key={item.id}>
              <Component {...item.props} />
            </NavigationWrapper>
          )
        })
      }
    default:
      throw new Error(`Unhandled action type: ${action.type as string}`)
  }
}
