import { createContext, useReducer, useContext, useLayoutEffect, type PropsWithChildren } from 'react'
import { ContentWrapper } from '../components/test/Wrapper'

interface NavigationState {
  content: JSX.Element[]
}

const initialState = {
  content: [
    <ContentWrapper><p>Init</p></ContentWrapper>
  ]
}

export enum NavigationActionType {
  ADD = 'add',
  REMOVE = 'remove',
  POP = 'pop'
}

const NavigationContext = createContext({} as NavigationState) // eslint-disable-line
const NavigationDispatchContext = createContext(null as unknown as React.Dispatch<any>)

function NavigationProvider ({ children }: PropsWithChildren): JSX.Element {
  const [state, dispatch] = useReducer(navigationReducer, initialState)

  // Pop if document width exceeds window width
  useLayoutEffect(() => {
    if (document.documentElement.scrollWidth > window.innerWidth) {
      dispatch({ type: NavigationActionType.POP })
    }
  }, [state])

  // Sync history state with navigation state
  function subscribe (callback) {
    window.addEventListener('popstate', callback)
    return () => {
      window.removeEventListener('popstate', callback)
    }
  }
  useSyncExternalStore(subscribe, getSnapshot)

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
  const test = <ContentWrapper><action.content /></ContentWrapper>
  switch (action.type) {
    case NavigationActionType.ADD:
      return {
        content: [
          ...state.content,
          test
        ]
      }
    case NavigationActionType.POP:
      return {
        content: [
          ...state.content.slice(1)
        ]
      }
    default:
      throw new Error(`Unhandled action type: ${action.type}`)
  }
}
export default NavigationProvider
