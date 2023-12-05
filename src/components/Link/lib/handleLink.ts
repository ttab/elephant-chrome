import type { MouseEvent } from 'react'
import {
  NavigationActionType,
  type NavigationAction,
  type ViewProps,
  type ViewRegistryItem,
  type ContentState,
  type ViewRegistry
} from '@/types'
import { toQueryString } from './toQueryString'

type Screens = Array<{
  key: string
  value: number
}>

interface LinkClick {
  event?: MouseEvent<HTMLAnchorElement>
  dispatch: React.Dispatch<NavigationAction>
  viewItem: ViewRegistryItem
  screens: Screens
  viewRegistry: ViewRegistry
  props?: ViewProps
  id: string
}

export function handleLink({ event, dispatch, viewItem, screens, viewRegistry, props, id }: LinkClick): void {
  if (event?.ctrlKey || event?.metaKey) {
    return
  }

  event?.preventDefault()

  // Create next (wanted) content state
  const content = [
    ...history.state.contentState,
    {
      ...props,
      id,
      name: viewItem.meta.name,
      path: `${viewItem.meta.path}${toQueryString(props)}`
    }
  ] as ContentState[]

  // Remove what does not fit
  while (minimumSpaceRequired(content, viewRegistry, screens) > 12) {
    content.shift()
  }

  // Set state
  dispatch({
    type: NavigationActionType.SET,
    content
  })

  // Set history state
  history.pushState({
    id,
    props: { ...props, id },
    itemName: viewItem.meta.name,
    contentState: content
  }, viewItem.meta.name, `${viewItem.meta.path}${toQueryString(props)}`)
}


// Calculate how much space (columns in grid) the content requires as a minimum
function minimumSpaceRequired(content: ContentState[], viewRegistry: ViewRegistry, screens: Screens): number {
  // Default to biggest screen, then find biggest screen size allowed
  let screen = screens.slice(-1)[0]
  const filteredScreens = screens.filter(s => {
    return s.value > window.innerWidth
  }).reverse()

  // Find the smallest defined screen size that can handle current screen width
  if (filteredScreens.length) {
    screen = filteredScreens.slice(-1)[0]
  }

  const views = content
    .filter(item => !!item.name) // Happens during init phase
    .map((item): { name: string, width: number } => {
      const name = item.name
      return {
        name,
        width: viewRegistry.get(name).meta.widths[screen.key]
      }
    })

  return views.reduce((total, view) => {
    return view.width + total
  }, 0)
}
