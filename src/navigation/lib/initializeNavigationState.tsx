import type { NavigationState, ViewRegistryItem, View } from '@/types'
import * as views from '@/views'
import { currentView } from '@/navigation/lib'
import { type HistoryState } from '../hooks/useHistory'

const registeredComponents = new Map() as Map<string, ViewRegistryItem>

export function initializeNavigationState(): NavigationState {
  Object.keys(views).forEach((name) => {
    registeredComponents.set(name, {
      component: views[name as View],
      meta: views[name as View].meta
    })
  })

  const { name, props } = currentView()
  if (!history?.state?.contentState?.length) {
    const viewId = crypto.randomUUID()
    history.pushState({
      viewId,
      contentState: [{
        viewId,
        name,
        props,
        path: window.location.pathname
      }]
    }, '', `${import.meta.env.BASE_URL}/${name.toLowerCase()}`)

    return {
      viewRegistry,
      focus: null,
      active: viewId,
      content: [{
        viewId,
        name: name as View,
        props,
        path: window.location.pathname
      }]
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


const viewRegistry = {
  get: (name: View) => {
    const registryItem = registeredComponents.get(name)

    if (registryItem === undefined) {
      // We must always have an Error view registered!
      return registeredComponents.get('Error') as unknown as ViewRegistryItem
    }

    return registryItem
  },

  set: () => {
    throw new Error('"Set" is not implemented')
  }
}
