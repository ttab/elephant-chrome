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
import type { HistoryInterface } from '@/navigation/hooks/useHistory'

interface LinkClick {
  event?: MouseEvent<Element> | KeyboardEvent
  dispatch: React.Dispatch<NavigationAction>
  viewItem: ViewRegistryItem
  viewRegistry: ViewRegistry
  viewId: string
  props?: ViewProps
  origin: string
  target?: 'self' | 'blank'
  onDocumentCreated?: () => void
  history: HistoryInterface
}

export function handleLink({
  event,
  dispatch, // FIXME: Is this necessary?
  viewItem,
  viewRegistry,
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
  const content: ContentState[] = history.state?.contentState || []

  // Create next (wanted) content state (props can not be functions!)
  const newContent: ContentState = {
    viewId,
    name: viewItem.meta.name,
    path: `${viewItem.meta.path}${toQueryString(props)}`,
    props
  }

  // If modifier is used, open furthest to the right, otherwise to the right of origin view
  const currentIndex = content.findIndex(c => c.viewId === origin)
  if (event?.shiftKey) {
    content.push(newContent)
  } else if (target === 'self') {
    content.splice(currentIndex - 1, 1, newContent)
  } else {
    content.splice(currentIndex + 1, Infinity, newContent)
  }

  // Remove views what does not fit to the left
  while (minimumSpaceRequired(content, viewRegistry) > 12) {
    content.shift()
  }

  // Push new history state
  history.pushState(`${viewItem.meta.path}${toQueryString(props)}`, {
    viewId,
    contentState: content
  })

  //
  // FIXME: Creeate solution for onDocumentCreated!!! (Could be sent with pushState and dispatched to navigation...?)
  //

  // Append onDocumentCreated to props if available
  // This since we can't save a function to history state
  // if (onDocumentCreated) {
  //   const currentIndex = content.findIndex(c => c.viewId === viewId)

  //   content[currentIndex].props = { ...content[currentIndex].props, onDocumentCreated }
  // }

  // dispatch({
  //   type: NavigationActionType.SET,
  //   content
  // })
}
