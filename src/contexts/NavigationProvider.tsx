import {
  createContext,
  useReducer,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type PropsWithChildren
} from 'react'
import { NavigationWrapper } from '@/components/NavigationWrapper'

import * as views from '@/views'
import { Init } from '@/views'

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
  contentState: Array<Record<string, unknown>>
}

export enum NavigationActionType {
  ADD = 'add',
  REMOVE = 'remove',
  SET = 'setContent'
}

const initialState = {
  stack: ['init'],
  stackPosition: 0,
  content: [
    (
      <NavigationWrapper>
        <Init />
      </NavigationWrapper>
    )
  ]
}

const NavigationContext = createContext({} as NavigationState) // eslint-disable-line
const NavigationDispatchContext = createContext(null as unknown as React.Dispatch<any>)

export function NavigationProvider({ children }: PropsWithChildren): JSX.Element {
  const [state, dispatch] = useReducer(navigationReducer, initialState)

  // Sync history state with navigation state
  function subscribe(callback) {
    window.addEventListener('popstate', callback)
    return () => {
      window.removeEventListener('popstate', callback)
    }
  }

  function getSnapshot(): HistoryState {
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
        contentState: [{ id: 'init', componentName: 'Init', props: { id: 'init' } }]
      },
      document.title,
      window.location.href
      )
      return
    }

    dispatch({ type: NavigationActionType.SET, newContent: historyState.contentState })
  }, [historyState])

  // Remove first element if document width exceeds window width
  useLayoutEffect(() => {
    if (document.documentElement.scrollWidth > window.innerWidth) {
      dispatch({ type: NavigationActionType.REMOVE })
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
export function useNavigationState(): any {
  return useContext(NavigationContext)
}

// Modify navigation state through dispatch
export function useNavigationDispatch(): any {
  return useContext(NavigationDispatchContext)
}

function navigationReducer(state, action): NavigationState {
  switch (action.type) {
    case NavigationActionType.ADD:
      return {
        // FIXME: Now we remove ledger entries after current stackPosition when we ADD new entries.
        // New navigation path. This works right now but might not when we implement a active window
        // (any window in view, and navigation should act from that position)
        stack: action.id !== undefined ? [...state.stack.slice(0, state.stackPosition + 1), action.id] : state.stack,
        stackPosition: state.stackPosition + 1,
        content: [
          ...state.content,
          <NavigationWrapper><action.content {...action.props }/></NavigationWrapper>

        ]
      }
    case NavigationActionType.REMOVE:
      return {
        ...state,
        content: [
          ...state.content.slice(1, state.content.length)
        ]
      }
    case NavigationActionType.SET:
      return {
        ...state,
        content: action.newContent.map((item) => {
          const Component = item.componentName ? views[item.componentName] : Init
          return (
            <NavigationWrapper>
              <Component {...item.props} />
            </NavigationWrapper>
          )
        })
      }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}
