import { NavigationWrapper } from '@/navigation/components'
import {
  NavigationActionType,
  type ContentState,
  type HistoryState,
  type NavigationAction,
  type NavigationState
} from '@/types'

export function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case NavigationActionType.ADD:

      if (action.component === undefined || action.props === undefined) {
        throw new Error('Component is undefined')
      }

      return {
        ...state,
        active: action.id,
        content: [
          ...state.content,
          <NavigationWrapper key={action.id} id={action.id}>
            <action.component {...action.props} />
          </NavigationWrapper>

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
        active: action.content[action.content.length - 1].id,
        content: action.content.map((item: ContentState, index): JSX.Element => {
          const Component = state.registry.get(item.name)?.component

          return (
            <NavigationWrapper key={item.id} id={item.id}>
              <Component {...{ ...item, index }} />
            </NavigationWrapper>
          )
        })
      }

    case NavigationActionType.FOCUS:

      if (action.id === undefined) {
        throw new Error('Id is undefined')
      }

      return {
        ...state,
        focus: action.id === state.focus
          ? null
          : action.id
      }

    case NavigationActionType.ACTIVE: {
      if (action.id === undefined) {
        throw new Error('Id is undefined')
      }

      const current = history.state.contentState.find((item: HistoryState) => item.id === action.id)

      history.replaceState({
        id: action.id,
        itemName: current.name,
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
