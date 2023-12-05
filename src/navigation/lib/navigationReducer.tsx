import { NavigationWrapper } from '@/navigation/components'
import {
  NavigationActionType,
  type ContentState,
  type HistoryState,
  type NavigationAction,
  type NavigationState
} from '@/types'


export function navigationReducer(newState: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case NavigationActionType.SET: {
      if (action.content === undefined) {
        throw new Error('Content is undefined')
      }

      const views = calculateViews(newState, action.content)

      return {
        ...newState,
        views,
        active: action.content[action.content.length - 1].id,
        content: action.content.map((item: ContentState, index): JSX.Element => {
          const Component = newState.viewRegistry.get(item.name)?.component
          const width = views[index]

          return (
            <NavigationWrapper
              name={item.name}
              key={item.id}
              id={item.id}
              colSpan={width.colSpan as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}
            >
              <Component {...{ ...item, index }} />
            </NavigationWrapper>
          )
        })
      }
    }

    case NavigationActionType.FOCUS:
      if (action.id === undefined) {
        throw new Error('Id is undefined')
      }

      return {
        ...newState,
        focus: action.id === newState.focus ? null : action.id
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
        ...newState,
        active: action.id
      }
    }

    default:
      throw new Error(`Unhandled action type: ${action.type as string}`)
  }
}


function calculateViews(state: NavigationState, content: ContentState[]): Array<{ name: string, colSpan: number }> {
  let screen = state.screens[state.screens.length - 1]
  const screens = state.screens.filter(s => {
    return s.value > window.innerWidth
  }).reverse()

  // Find the smallest defined screen size that can handle current screen width
  if (screens.length) {
    screen = screens[screens.length - 1]
  }

  // Extracts all current views based from components content as name/wanted minimum width
  const views = content
    .filter(item => !!item.name) // Happens during init phase
    .map((item): { name: string, width: number } => {
      const name = item.name
      return {
        name,
        width: state.viewRegistry.get(name).meta.widths[screen.key]
      }
    })

  // Happens during init phase
  if (!views.length) {
    return []
  }

  // Calculate total requested minimum colSpan
  const usedSpace = views.reduce((total, view) => {
    return view.width + total
  }, 0)

  // Calculate what colSpan each view is assigned
  const widths = views.map(view => {
    return {
      name: view.name,
      colSpan: Math.floor(12 * (view.width / usedSpace))
    }
  })

  // Assign extra space left to the last view so it expands if necessary
  const usedColSpan = widths.reduce((total, item) => { return item.colSpan + total }, 0)
  if (usedColSpan < 12) {
    widths[widths.length - 1].colSpan += 12 - usedColSpan
  }

  // state.views = widths

  return widths
}
