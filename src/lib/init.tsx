import type { NavigationState, RegistryItem, View } from '@/types'
import { NavigationWrapper } from '@/navigation/components/NavigationWrapper'
import * as views from '@/views'

const registeredComponents = new Map()

const registry = {
  get: (key: View) => {
    const registryItem: RegistryItem = registeredComponents.get(key)
    if (registryItem === undefined) {
      throw new Error(`Can't find component: ${key}`)
    }
    return registryItem
  },

  getByPath: (path: string): RegistryItem => {
    for (const [key, value] of registeredComponents) {
      if (value.meta.path === path) {
        return registeredComponents.get(key)
      }
    }
    throw new Error(`Can't find component by path: ${path}`)
  },
  set: () => {
    throw new Error('"Set" is not implemented')
  }
}

export function init(): NavigationState {
  Object.keys(views).forEach((name) => {
    registeredComponents.set(name, {
      component: views[name as View],
      meta: views[name as View].meta
    })
  })

  const InititalView = registry.getByPath(window.location.pathname)

  return {
    registry,
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
