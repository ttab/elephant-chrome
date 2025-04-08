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

export type Target = 'self' | 'blank' | 'last'
interface LinkClick {
  event?: MouseEvent<Element> | KeyboardEvent | React.KeyboardEvent<HTMLButtonElement> | undefined
  dispatch: React.Dispatch<NavigationAction>
  viewItem: ViewRegistryItem
  viewId: string
  props?: ViewProps
  origin: string
  target?: Target
  onDocumentCreated?: () => void
  history: HistoryInterface
  keepFocus?: boolean
  readOnly?: {
    version?: bigint
  }
}

export function handleLink({
  event,
  dispatch,
  viewItem,
  props,
  viewId: newViewId,
  origin,
  target,
  onDocumentCreated,
  history,
  keepFocus,
  readOnly
}: LinkClick): void {
  if (event?.ctrlKey || event?.metaKey) {
    return
  }
  event?.preventDefault()
  event?.stopPropagation()

  // Get current state from history
  const content: ContentState[] = [...history.state?.contentState || []]
  const currentViewId = history.state?.viewId
  const currentPath = history.state?.contentState.find((c) => c.viewId === currentViewId)

  // Create next (wanted) content state (props can not be functions!)
  const newContent: ContentState = {
    viewId: newViewId,
    name: viewItem.meta.name,
    path: `${viewItem.meta.path}${toQueryString(props)}`,
    props,
    ...(readOnly && {
      readOnly: {
        version: readOnly?.version
      }
    })
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

  const viewId = keepFocus && currentViewId ? currentViewId : newViewId
  const path = keepFocus && currentPath ? currentPath.path : viewItem.meta.path

  // Listen for when the change has been done and then add onDocumentCreated callback
  // to the navigation state as we can't store functions in history state.
  window.addEventListener('popstate', () => {
    const currentIndex = content.findIndex((c) => c.viewId === viewId)
    content[currentIndex].props = { ...content[currentIndex].props, onDocumentCreated }

    dispatch({
      viewId,
      content,
      type: NavigationActionType.ON_DOC_CREATED,
      callback: onDocumentCreated
    })
  }, { once: true })

  // Push new history state
  history.pushState(`${path}${toQueryString(props)}`, {
    viewId,
    contentState: content
  })

  if (!onDocumentCreated) {
    return
  }
}
