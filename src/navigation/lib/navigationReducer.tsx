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

      const views = calculateViewWidths(state.viewRegistry, action.content)

      return {
        ...state,
        views,
        focus: null,
        active: action?.active || action.content[action.content.length - 1].viewId,
        content: action.content.map((item: ContentState, index): JSX.Element => {
          const Component = state.viewRegistry.get(item.name)?.component
          const { colSpan } = views[index]

          return (
            <ViewWrapper key={item.viewId} viewId={item.viewId} name={item.name} colSpan={colSpan}>
              <Component {...item.props} />
            </ViewWrapper>
          )
        })
      }
    }

    case NavigationActionType.FOCUS:
      if (action.viewId === undefined) {
        throw new Error('ViewId is undefined')
      }

      return {
        ...state,
        focus: action.viewId === state.focus ? null : action.viewId
      }

    case NavigationActionType.ACTIVE: {
      if (action.viewId === undefined) {
        throw new Error('ViewId is undefined')
      }

      const current: ContentState = history.state.contentState.find((item: HistoryState) => item.viewId === action.viewId) || {}

      history.replaceState({
        id: action.viewId,
        viewName: current.name,
        path: current.path,
        contentState: history.state.contentState
      }, current.name, `${window.location.protocol}//${window.location.host}${current.path}`)


      return {
        ...state,
        focus: null,
        active: action.viewId
      }
    }

    default:
      throw new Error(`Unhandled action type: ${action.type as string}`)
  }
}
