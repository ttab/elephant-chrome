import type { MouseEvent } from 'react'
import {
  type NavigationAction,
  type ViewProps,
  type ViewRegistryItem,
  type ContentState,
  NavigationActionType
} from '@/types'
import { toQueryString } from './toQueryString'
import type { HistoryInterface } from '@/navigation/hooks/useHistory'

interface LinkClick {
  event?: MouseEvent<Element> | KeyboardEvent
  dispatch: React.Dispatch<NavigationAction>
  viewItem: ViewRegistryItem
  viewId: string
  props?: ViewProps
  origin: string
  target?: 'self' | 'blank' | 'last'
  onDocumentCreated?: () => void
  history: HistoryInterface
}

export function handleLink({
  event,
  dispatch,
  viewItem,
  props,
  viewId,
  origin,
  target,
  onDocumentCreated,
  history
}: LinkClick): void {
  if (event?.ctrlKey || event?.metaKey) {
    return
  }
  event?.preventDefault()
  event?.stopPropagation()

  // Get current state from history
  const content: ContentState[] = [...history.state?.contentState || []]

  // Create next (wanted) content state (props can not be functions!)
  const newContent: ContentState = {
    viewId,
    name: viewItem.meta.name,
    path: `${viewItem.meta.path}${toQueryString(props)}`,
    props
  }

  // If modifier is used, open furthest to the right, otherwise to the right of origin view
  const currentIndex = content.findIndex((c) => c.viewId === origin)

  if (event?.shiftKey) {
    content.push(newContent)
  } else if (target === 'self') {
    content.splice(currentIndex, 1, newContent)
  } else if (target === 'last') {
    content.push(newContent)
  } else {
    content.splice(currentIndex + 1, Infinity, newContent)
  }

  // Push new history state
  history.pushState(`${viewItem.meta.path}${toQueryString(props)}`, {
    viewId,
    contentState: content
  })

  if (!onDocumentCreated) {
    return
  }

  // Listen for when the change has been done and then add onDocumentCreated callback
  // to the navigation state as we can't store functions in history state.
  window.addEventListener('popstate', () => {
    const currentIndex = content.findIndex((c) => c.viewId === viewId)
    content[currentIndex].props = { ...content[currentIndex].props, onDocumentCreated }

    dispatch({
      viewId,
      type: NavigationActionType.ON_DOC_CREATED,
      callback: onDocumentCreated
    })
  }, { once: true })
}
