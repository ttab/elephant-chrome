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
}

export function handleLink({ event, dispatch, viewItem, viewRegistry, props, viewId }: LinkClick): void {
  if (event?.ctrlKey || event?.metaKey) {
    return
  }

  event?.preventDefault()

  // Create next (wanted) content state
  const content = [
    ...history.state.contentState,
    {
      props,
      viewId,
      name: viewItem.meta.name,
      path: `${viewItem.meta.path}${toQueryString(props)}`
    }
  ] as ContentState[]

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
