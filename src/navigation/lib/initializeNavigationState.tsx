import type { NavigationState, ViewRegistryItem, View } from '@/types'
import * as views from '@/views'
import { currentView } from '@/navigation/lib'
import { type HistoryState } from '../hooks/useHistory'
import type { QueryParams } from '@/hooks/useQuery'
import { toQueryString } from '@/components/Link/lib/toQueryString'

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
 * Appends user filters if provided, existing querystrings should take precedence.
 *
 * @param {Record<string, QueryParams>} [filters] - Optional filters to apply to the query string.
 * @returns {NavigationState} The initialized navigation state.
 */
export function initializeNavigationState(filters?: Record<string, QueryParams>): NavigationState {
  const { name, props } = currentView()
  const { pathname, search, href } = window.location

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
    const updatedPath = search ? pathname : pathname + toQueryString(filters?.[name])
    const updatedContentState = [{ ...contentState[0], path: updatedPath }]

    history.replaceState({ viewId, contentState: updatedContentState }, '', search ? href : updatedPath)

    return {
      viewRegistry,
      focus: null,
      active: viewId,
      content: updatedContentState
    }
  }
}
