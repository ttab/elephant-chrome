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
import { minimumSpaceRequired } from '@/navigation/lib'

interface LinkClick {
  event?: MouseEvent<HTMLAnchorElement>
  dispatch: React.Dispatch<NavigationAction>
  viewItem: ViewRegistryItem
  viewRegistry: ViewRegistry
  viewId: string
  props?: ViewProps
  origin: string
}

export function handleLink({ event, dispatch, viewItem, viewRegistry, props, viewId, origin }: LinkClick): void {
  if (event?.ctrlKey || event?.metaKey) {
    return
  }

  const content: ContentState[] = history.state.contentState

  // Create next (wanted) content state
  const newContent: ContentState =
    {
      props,
      viewId,
      name: viewItem.meta.name,
      path: `${viewItem.meta.path}${toQueryString(props)}`
    }

  // If modifier is used, open furthest to the right
  // Otherwise open to the right of origin
  if (event?.shiftKey) {
    content.push(newContent)
  } else {
    const currentIndex = content.findIndex(c => c.viewId === origin)

    content.splice(currentIndex + 1)
    content.push(newContent)
  }

  event?.preventDefault()


  // Remove what does not fit
  while (minimumSpaceRequired(content, viewRegistry) > 12) {
    content.shift()
  }

  // Set history state first, then navigation state
  history.pushState({
    viewId,
    props,
    viewName: viewItem.meta.name,
    contentState: content
  }, viewItem.meta.name, `${viewItem.meta.path}${toQueryString(props)}`)

  dispatch({
    type: NavigationActionType.SET,
    content
  })
}
