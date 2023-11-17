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

export function toQueryString(obj:
Record<string, string> | Omit<ViewProps, 'id'> | undefined):
  string {
  if (!obj || Object.keys(obj).length === 0) {
    return ''
  }
  return `?${new URLSearchParams(obj as Record<string, string>).toString()}`
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
      ...props
    },
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
        name: linkItem.metadata.name
      }
    ]
  }, linkItem.metadata.name, `${linkItem.metadata.path}${toQueryString(props)}`)
}

