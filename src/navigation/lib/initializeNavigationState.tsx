import type { NavigationState, ViewRegistryItem, BuiltinView } from '@/types'
import * as views from '@/views'
import { PendingView } from '@/views/PendingView'
import { currentView } from '@/navigation/lib'
import { type HistoryState } from '../hooks/useHistory'

const registeredComponents = new Map<string, ViewRegistryItem>()
const listeners = new Set<() => void>()
let version = 0

function notifyListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}

Object.keys(views).forEach((name) => {
  registeredComponents.set(name, {
    component: views[name as BuiltinView],
    meta: views[name as BuiltinView].meta
  })
})

// Ensure the Error view is always registered
if (!registeredComponents.has('Error')) {
  throw new Error('Error view must be registered')
}

const pendingViewItem: ViewRegistryItem = {
  component: PendingView,
  meta: (registeredComponents.get('Error') as ViewRegistryItem).meta
}

const viewRegistry = {
  get: (name: string) => {
    const exact = registeredComponents.get(name)
    if (exact) {
      return exact
    }

    // Fall back to path-based lookup for plugin views that use namespaced
    // names (e.g. "plugin:dummy-plugin:DummyView") where the URL-derived
    // name won't match the registered key.
    const currentPath = window.location.pathname
    for (const item of registeredComponents.values()) {
      if (item.meta.path === currentPath) {
        return item
      }
    }

    // Show a loading skeleton while plugins are still registering.
    // PendingView falls back to Error after a 3 s timeout.
    return pendingViewItem
  },
  set: (name: string, item: ViewRegistryItem): (() => void) => {
    registeredComponents.set(name, item)
    version++
    notifyListeners()

    return () => {
      registeredComponents.delete(name)
      version++
      notifyListeners()
    }
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },
  getVersion: (): number => {
    return version
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
