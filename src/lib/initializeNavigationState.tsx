import type { NavigationState, ViewRegistryItem, View } from '@/types'
import { ViewWrapper } from '@/components/ViewWrapper'
import * as views from '@/views'
import * as uuid from 'uuid'
import { ViewProvider } from '@/contexts/ViewProvider'
import { currentView } from '@/navigation/lib'

const registeredComponents = new Map() as Map<string, ViewRegistryItem>

export function initializeNavigationState(): NavigationState {
  Object.keys(views).forEach((name) => {
    registeredComponents.set(name, {
      component: views[name as View],
      meta: views[name as View].meta
    })
  })

  const { name = 'start', props } = currentView()
  const InititalView = viewRegistry.getByPath(window.location.pathname)
  const id = uuid.v4()
  const content = [
    (
      <ViewProvider key={id} id={id} name={name}>
        <ViewWrapper colSpan={12}>
          <InititalView.component id={id} />
        </ViewWrapper>
      </ViewProvider>
    )
  ]

  if (!history?.state?.contentState) {
    history.replaceState({
      id: 'start',
      viewName: name,
      contentState: [{
        id,
        name,
        props,
        path: '/'
      }]
    }, document.title, window.location.href)
  }

  return {
    viewRegistry,
    views: [{ name, colSpan: 12 }],
    focus: null,
    active: id,
    content
  }
}


const viewRegistry = {
  get: (name: View) => {
    const registryItem = registeredComponents.get(name)

    if (registryItem === undefined) {
      throw new Error(`Can't find component: ${name}`)
    }

    return registryItem
  },

  getByPath: (path: string): ViewRegistryItem => {
    for (const [, registryItem] of registeredComponents) {
      // remove trailing slashes
      if (registryItem.meta.path === path || registryItem.meta.path === path.replace(/\/$/, '')) {
        return registryItem
      }
    }

    throw new Error(`Can't find component by path: ${path}`)
  },

  set: () => {
    throw new Error('"Set" is not implemented')
  }
}
