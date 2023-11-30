import type { NavigationState, ViewRegistryItem, View } from '@/types'
import { NavigationWrapper } from '@/navigation/components/NavigationWrapper'
import * as views from '@/views'

const registeredComponents = new Map() as Map<string, ViewRegistryItem>

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
      if (registryItem.meta.path === path) {
        return registryItem
      }
    }

    throw new Error(`Can't find component by path: ${path}`)
  },

  set: () => {
    throw new Error('"Set" is not implemented')
  }
}


export function initializeNavigationState(): NavigationState {
  Object.keys(views).forEach((name) => {
    registeredComponents.set(name, {
      component: views[name as View],
      meta: views[name as View].meta
    })
  })

  const InititalView = viewRegistry.getByPath(window.location.pathname)

  return {
    viewRegistry,
    focus: null,
    active: 'start',
    content: [
      (
        <NavigationWrapper key='start' id='start'>
          <InititalView.component id='start' />
        </NavigationWrapper>
      )
    ]
  }
}
