import type { MouseEvent } from 'react'
import {
  NavigationActionType,
  type NavigationAction,
  type ViewProps,
  type RegistryItem
} from '@/types'
import { toQueryString } from './toQueryString'

interface LinkClick {
  event?: MouseEvent<HTMLAnchorElement>
  dispatch: React.Dispatch<NavigationAction>
  linkItem: RegistryItem
  props?: ViewProps
  id: string
}

export function handleLink({ event, dispatch, linkItem, props, id }: LinkClick): void {
  if (event?.ctrlKey || event?.metaKey) {
    return
  }

  event?.preventDefault()

  dispatch({
    type: NavigationActionType.ADD,
    component: linkItem.component,
    props: { ...props, id },
    id
  })

  history.pushState({
    id,
    props: { ...props, id },
    itemName: linkItem.metadata.name,
    contentState: [
      ...history.state.contentState,
      {
        ...props,
        id,
        name: linkItem.metadata.name,
        path: `${linkItem.metadata.path}${toQueryString(props)}`
      }
    ]
  }, linkItem.metadata.name, `${linkItem.metadata.path}${toQueryString(props)}`)
}
