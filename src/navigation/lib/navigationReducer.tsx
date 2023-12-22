import { ViewProvider } from '@/contexts'
import { ViewWrapper } from '@/components'

import {
  NavigationActionType,
  type ContentState,
  type HistoryState,
  type NavigationAction,
  type NavigationState
} from '@/types'

import { calculateViewWidths } from './calculateViewWidths'

export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case NavigationActionType.SET: {
      if (action.content === undefined) {
        throw new Error('Content is undefined')
      }

      // const views = calculateViews(state, screenDefinitions, action.content)
      const views = calculateViewWidths(state.viewRegistry, action.content)

      return {
        ...state,
        views,
        active: action?.active || action.content[action.content.length - 1].id,
        content: action.content.map((item: ContentState, index): JSX.Element => {
          const Component = state.viewRegistry.get(item.name)?.component
          const width = views[index]

          return (
            <ViewProvider key={item.id} id={item.id} name={item.name}>
              <ViewWrapper colSpan={width.colSpan}>
                <Component {...{ ...item, index }} />
              </ViewWrapper>
            </ViewProvider>
          )
        })
      }
    }

    case NavigationActionType.FOCUS:
      if (action.id === undefined) {
        throw new Error('Id is undefined')
      }

      return {
        ...state,
        focus: action.id === state.focus ? null : action.id
      }

    case NavigationActionType.ACTIVE: {
      if (action.id === undefined) {
        throw new Error('Id is undefined')
      }

      const current = history.state.contentState.find((item: HistoryState) => item.id === action.id)

      history.replaceState({
        id: action.id,
        viewName: current.name,
        path: current.path,
        contentState: history.state.contentState
      }, current.name, `${window.location.protocol}//${window.location.host}${current.path}`)


      return {
        ...state,
        active: action.id
      }
    }

    default:
      throw new Error(`Unhandled action type: ${action.type as string}`)
  }
}
