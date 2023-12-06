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
  screens: Array<{ key: string, value: number }>
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
