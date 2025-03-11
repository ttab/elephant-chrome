import type { NavigationState, ViewRegistryItem, View } from '@/types'
import * as views from '@/views'
import { currentView } from '@/navigation/lib'
import { type HistoryState } from '../hooks/useHistory'

const registeredComponents = new Map<string, ViewRegistryItem>()

Object.keys(views).forEach((name) => {
  registeredComponents.set(name, {
    component: views[name as View],
    meta: views[name as View].meta
  })
})

// Ensure the Error view is always registered
if (!registeredComponents.has('Error')) {
  throw new Error('Error view must be registered')
}

const viewRegistry = {
  get: (name: View) => {
    return registeredComponents.get(name) ?? registeredComponents.get('Error') as ViewRegistryItem
  },
  set: () => {
    throw new Error('"Set" is not implemented')
  }
}

/**
 * Initializes the navigation state based on the current view and URL.
 *
 * @returns {NavigationState} The initialized navigation state.
 */
export function initializeNavigationState(): NavigationState {
  const { name, props } = currentView()
  const { pathname, href } = window.location

  if (!(history?.state as HistoryState)?.contentState?.length) {
    const viewId = crypto.randomUUID()
    const contentState = [{
      viewId,
      name,
      props,
      path: pathname
    }]

    history.replaceState({ viewId, contentState }, '', href)

    return {
      viewRegistry,
      focus: null,
      active: viewId,
      content: contentState
    }
  } else {
    const { viewId, contentState } = window.history.state as HistoryState
    return {
      viewRegistry,
      focus: null,
      active: viewId,
      content: contentState
    }
  }
}
