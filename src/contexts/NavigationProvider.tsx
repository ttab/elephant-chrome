import {
  createContext,
  useReducer,
  useLayoutEffect,
  type PropsWithChildren
} from 'react'
import { NavigationWrapper } from '@/components/NavigationWrapper'
import type { ContentState, NavigationAction } from '@/types'
import { NavigationActionType } from '@/types'

import { useHistory } from '@/hooks'

import * as views from '@/views'
import { Init } from '@/views'

export interface NavigationState {
  stack: string[] // Stack history ledger
  stackPosition: number // Position in the stack ledger
  content: JSX.Element[]
}

const initialState: NavigationState = {
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

export const NavigationContext = createContext(initialState)

export const NavigationProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [state, dispatch] = useReducer(navigationReducer, initialState)
  const historyState = useHistory()

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

    dispatch({ type: NavigationActionType.SET, content: historyState.contentState })
  }, [historyState])

  // Remove first element if document width exceeds window width
  useLayoutEffect(() => {
    if (document.documentElement.scrollWidth > window.innerWidth) {
      dispatch({ type: NavigationActionType.REMOVE })
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
      if (action.component === undefined) {
        throw new Error('Component is undefined')
      }
      return {
        stack: action.id !== undefined ? [...state.stack.slice(0, state.stackPosition + 1), action.id] : state.stack,
        stackPosition: state.stackPosition + 1,
        content: [
          ...state.content,
          <NavigationWrapper key={action.id}><action.component { ...action.props }/></NavigationWrapper>

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
      if (action.content === undefined) {
        throw new Error('Content is undefined')
      }
      return {
        ...state,
        content: action.content.map((item: ContentState): JSX.Element => {
          const Component = item.name !== undefined ? views[item.name] : Init
          return (
            <NavigationWrapper>
              <Component {...item.props} />
            </NavigationWrapper>
          )
        })
      }
    default:
      throw new Error(`Unhandled action type: ${action.type as string}`)
  }
}
