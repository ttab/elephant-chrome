import { NavigationWrapper } from '@/navigation/components'
import {
  NavigationActionType,
  type ContentState,
  type HistoryState,
  type NavigationAction,
  type NavigationState
} from '@/types'


export function navigationReducer(prevState: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case NavigationActionType.ADD: {
      if (action.component === undefined || action.props === undefined) {
        throw new Error('Component is undefined')
      }

      const newState = {
        ...prevState,
        active: action.id,
        content: [
          ...prevState.content,
          < NavigationWrapper name={action.name || ''} key={action.id} id={action.id} colSpan={6} >
            <action.component {...action.props} />
          </NavigationWrapper >
        ]
      }

      // Calculate number of views and what each screen needs
      const { state: nextState, widths } = calculateParts(newState)
      nextState.views = widths
      return nextState
    }

    // case NavigationActionType.REMOVE:
    //   console.log('REMOVE')

    //   // TODO: Calculate number of views and what each screen needs

    //   return {
    //     ...state,
    //     content: [
    //       ...state.content.slice(1, state.content.length)
    //     ]
    //   }

    case NavigationActionType.SET: {
      if (action.content === undefined) {
        throw new Error('Content is undefined')
      }

      // TODO: Calculate number of views and what each screen needs
      const { widths, state: nextState } = calculateParts(prevState)

      return {
        ...nextState,
        views: widths,
        active: action.content[action.content.length - 1].id,
        content: action.content.map((item: ContentState, index): JSX.Element => {
          const Component = prevState.viewRegistry.get(item.name)?.component
          const width = widths.find(vw => vw.name === item.name) || { name: 'default', colSpan: 12 }

          return (
            <NavigationWrapper name={item.name} key={item.id} id={item.id} colSpan={width.colSpan}>
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
        ...prevState,
        focus: action.id === prevState.focus ? null : action.id
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
        ...prevState,
        active: action.id
      }
    }

    default:
      throw new Error(`Unhandled action type: ${action.type as string}`)
  }
}


function calculateParts(state: NavigationState): {
  widths: Array<{ name: string, colSpan: number }>
  state: NavigationState
  removed: JSX.Element[]
} {
  let screen = state.screens[state.screens.length - 1]
  const screens = state.screens.filter(s => {
    return s.value > window.innerWidth
  }).reverse()

  // Find the smallest defined screen size that can handle current screen width
  if (screens.length) {
    screen = screens[screens.length - 1]
  }

  // Extracts all current views as name/wanted minimum width
  const views = state.content
    .filter(item => !!item.props.name) // Happens during init phase
    .map((item): { name: string, width: number } => {
      const name = item.props.name
      return {
        name,
        width: state.viewRegistry.get(name).meta.widths[screen.key]
      }
    })

  // Happens during init phase
  if (!views.length) {
    return {
      widths: [],
      state,
      removed: []
    }
  }


  // Calculate sum of minimum wanted screen share
  const removed: JSX.Element[] = []
  do {
    removed.push(state.content[0])
    state.content.slice(1, state.content.length)
    views.slice(1, views.length)
  } while (minimumSpaceRequired(views) > 12)

  // Calculate colSpan for each view
  // Should we use round and then adjust last view? This is safer though...
  const widths = views.map(view => {
    return {
      name: view.name,
      colSpan: Math.floor(12 * (view.width / 12))
    }
  })

  // Assign extra space left to the last view so it expands a bit
  const usedColSpan = widths.reduce((total, item) => { return item.colSpan + total }, 0)
  if (usedColSpan < 12) {
    widths[widths.length - 1].colSpan += 12 - usedColSpan
  }

  state.views = widths

  return {
    state,
    removed,
    widths
  }
}


// Calculate minimum required space for current views
function minimumSpaceRequired(views: Array<{ name: string, width: number }>): number {
  return views.reduce((total, view) => {
    return view.width + total
  }, 0)
}
