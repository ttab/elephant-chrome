import type { NavigationState, RegistryItem, View } from '@/types'
import { NavigationWrapper } from '@/components'
import * as views from '@/views'

const registeredComponents = new Map()
const registry = {
  get: (key: View) => {
    console.log(key)
    const registryItem: RegistryItem = registeredComponents.get(key)
    if (registryItem === undefined) {
      throw new Error(`Can't find component: ${key}`)
    }
    return registryItem
  },
  getByPath: (path: string): RegistryItem => {
    for (const [key, value] of registeredComponents) {
      if (value.metadata.path === path) {
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
  for (const key in views) {
    if (views[key as View].displayName === undefined) {
      throw new Error(`Can't register views without displayName: ${key}`)
    } else {
      registeredComponents.set(key as View, {
        component: views[key as View],
        metadata: {
          path: key === 'PlanningOverview' ? '/' : `/${key.toLowerCase()}`,
          name: views[key as View].displayName
        }
      })
    }
  }

  const InititalView = registry.getByPath(window.location.pathname)

  return {
    registry,
    focus: null,
    content: [
      (
        <NavigationWrapper key='start' id='start'>
          <InititalView.component id='start' name='start' />
        </NavigationWrapper>
      )
    ]
  }
}
