import type { MouseEvent } from 'react'
import {
  NavigationActionType,
  type NavigationAction,
  type ViewProps,
  type ViewRegistryItem
} from '@/types'
import { toQueryString } from './toQueryString'

interface LinkClick {
  event?: MouseEvent<HTMLAnchorElement>
  dispatch: React.Dispatch<NavigationAction>
  viewItem: ViewRegistryItem
  props?: ViewProps
  id: string
}

export function handleLink({ event, dispatch, viewItem, props, id }: LinkClick): void {
  if (event?.ctrlKey || event?.metaKey) {
    return
  }

  event?.preventDefault()

  dispatch({
    type: NavigationActionType.ADD,
    component: viewItem.component,
    props: { ...props, id },
    id
  })

  history.pushState({
    id,
    props: { ...props, id },
    itemName: viewItem.meta.name,
    contentState: [
      ...history.state.contentState,
      {
        ...props,
        id,
        name: viewItem.meta.name,
        path: `${viewItem.meta.path}${toQueryString(props)}`
      }
    ]
  }, viewItem.meta.name, `${viewItem.meta.path}${toQueryString(props)}`)
}
