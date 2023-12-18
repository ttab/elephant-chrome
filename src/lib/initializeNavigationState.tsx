import type { NavigationState, ViewRegistryItem, View } from '@/types'
import { NavigationWrapper } from '@/navigation/components/NavigationWrapper'
import * as views from '@/views'
import * as uuid from 'uuid'
import { ViewProvider } from '@/contexts/ViewProvider'

const registeredComponents = new Map() as Map<string, ViewRegistryItem>

export function initializeNavigationState(): NavigationState {
  Object.keys(views).forEach((name) => {
    registeredComponents.set(name, {
      component: views[name as View],
      meta: views[name as View].meta
    })
  })

  const InititalView = viewRegistry.getByPath(window.location.pathname)
  const id = uuid.v4()
  const name = 'start'

  return {
    viewRegistry,
    views: [{ name, colSpan: 12 }],
    focus: null,
    active: id,
    content: [
      (
        <NavigationWrapper name='' key={id} id={id} colSpan={12}>
          <ViewProvider id={id} name={name}>
            <InititalView.component id={id} />
          </ViewProvider>
        </NavigationWrapper>
      )
    ]
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
