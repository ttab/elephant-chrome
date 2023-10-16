import {
  createContext,
  useReducer,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type PropsWithChildren
} from 'react'
import { ContentWrapper } from '../components/test/Wrapper'

import * as components from '../components/test'

interface NavigationState {
  stack: string[] // Stack history ledger
  stackPosition: number // Position in the stack ledger
  content: Array<{ // Renderable content
    id: string
    item: JSX.Element[]
  }>
}

interface HistoryState {
  id: string
  itemName: string
  props: Record<string, unknown>
  contentLength: number
}

export enum NavigationActionType {
  ADD_LAST = 'addLast',
  ADD_FIRST = 'addFirst',
  REMOVE_FIRST = 'removeFirst',
  REMOVE_LAST = 'removeLast',
  REMOVE_FROM_TO_LAST = 'removeFromToLast',
  POP = 'pop'
}

const initialState = {
  stack: ['init'],
  stackPosition: 0,
  content: [
    {
      id: 'init',
      item: (
      <ContentWrapper>
        <p>Init</p>
      </ContentWrapper>
      )
    }
  ]
}

const NavigationContext = createContext({} as NavigationState) // eslint-disable-line
const NavigationDispatchContext = createContext(null as unknown as React.Dispatch<any>)

function NavigationProvider ({ children }: PropsWithChildren): JSX.Element {
  const [state, dispatch] = useReducer(navigationReducer, initialState)

  // Sync history state with navigation state
  function subscribe (callback) {
    window.addEventListener('popstate', callback)
    // also use 'resize'
    return () => {
      window.removeEventListener('popstate', callback)
    }
  }

  function getSnapshot (): HistoryState {
    return history.state
  }

  const historyState = useSyncExternalStore(subscribe, getSnapshot)

  // Catch historyState changes ie browser navigation
  useLayoutEffect(() => {
    if (historyState === null) {
      // Create history state for initial content
      history.replaceState({
        id: 'init',
        itemName: 'init',
        contentLength: 0
      },
      document.title,
      window.location.href
      )
      return
    }

    // Backward movement
    if (state.stack.indexOf(historyState.id) < state.stackPosition) {
      dispatch({
        type: NavigationActionType.REMOVE_LAST
      })
      // TODO: ADD_FIRST if we have more entires in stack ledger before FIRST in content
      // How to calculate this?
    }

    // Forward movement
    if (state.stack.indexOf(historyState.id) > state.stackPosition) {
      dispatch({
        type: NavigationActionType.ADD_LAST,
        content: components[historyState.itemName],
        props: historyState.props
      })
    }

    // Link navigation
    // if (state.stack.indexOf(historyState.id) === state.stackPosition) {
    // }
  }, [historyState])

  // Remove first element if document width exceeds window width
  useLayoutEffect(() => {
    // TODO: Move this to useLayoutEffect above, there we have direction and can figure out if
    // we're going forward or backward, and if we're gonna remove first or last
    // Hmm, doesn't work to do both useEffects at the same time. We need to render content before
    // we know the size of the rendered content.
    if (document.documentElement.scrollWidth > window.innerWidth) {
      dispatch({ type: NavigationActionType.REMOVE_FIRST })
    }
  }, [state])

  return (
    <NavigationContext.Provider value={state}>
      <NavigationDispatchContext.Provider value={dispatch}>
        {children}
      </NavigationDispatchContext.Provider>
    </NavigationContext.Provider>
  )
}

// Navigation state
export function useNavigationState (): any {
  return useContext(NavigationContext)
}

// Modify navigation state through dispatch
export function useNavigationDispatch (): any {
  return useContext(NavigationDispatchContext)
}

function navigationReducer (state, action): NavigationState {
  switch (action.type) {
    case NavigationActionType.ADD_LAST:
      return {
        // FIXME: Now we remove ledger entries after current stackPosition when we ADD new entries.
        // New navigation path. This works right now but might not when we implement a active window
        // (any window in view, and navigation should act from that position)
        stack: action.id !== undefined ? [...state.stack.slice(0, state.stackPosition + 1), action.id] : state.stack,
        stackPosition: state.stackPosition + 1,
        content: [
          ...state.content,
          { id: action.id, item: <ContentWrapper><action.content {...action.props }/></ContentWrapper> }

        ]
      }
    case NavigationActionType.REMOVE_FIRST:
      return {
        ...state,
        content: [
          ...state.content.slice(1, state.content.length)
        ]
      }
    case NavigationActionType.REMOVE_LAST:
      return {
        ...state,
        stackPosition: state.stackPosition - 1,
        content: [
          ...state.content.slice(0, state.content.length - 1)
        ]
      }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}
export default NavigationProvider
