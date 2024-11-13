import {
  NavigationActionType,
  type ContentState,
  type NavigationAction,
  type NavigationState
} from '@/types'

export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case NavigationActionType.SET: {
      if (action.content === undefined) {
        throw new Error('Content is undefined')
      }

      return {
        ...state,
        focus: null,
        active: action?.active || action.content[action.content.length - 1].viewId,
        components: action.content.map((item: ContentState) => {
          return state.viewRegistry.get(item.name)?.component
        }),
        content: action.content
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
