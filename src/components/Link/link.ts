import type { MouseEvent } from 'react'
import {
  NavigationActionType,
  type NavigationAction,
  type ViewProps,
  type RegistryItem
} from '@/types'

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
    props: {
      ...props,
      name: linkItem.component.name,
      id
    }
  })

  history.pushState({
    id,
    props: { ...props, id },
    itemName: linkItem.metadata.name,
    contentState: [
      ...history.state.contentState,
      {
        id,
        name: linkItem.metadata.name,
        props
      }
    ]
  }, linkItem.metadata.name, `${linkItem.metadata.path}?id=${id}`)
}

