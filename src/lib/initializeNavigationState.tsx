import type { NavigationState, ViewRegistryItem, View } from '@/types'
import { NavigationWrapper } from '@/navigation/components/NavigationWrapper'
import * as views from '@/views'
import tailwindConfig from '@ttab/elephant-ui/styles/presetResolved.json'

const registeredComponents = new Map() as Map<string, ViewRegistryItem>

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
    screens: getScreens(),
    views: [{ name: 'start', colSpan: 12 }],
    focus: null,
    active: 'start',
    content: [
      (
        <NavigationWrapper name='' key='start' id='start' colSpan={12}>
          <InititalView.component id='start' />
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

// Get defined screens from tailwind config as a sorted array
function getScreens(): Array<{ key: string, value: number }> {
  const definedScreens = tailwindConfig.theme.screens as Record<string, string>
  const screens: Array<{ key: string, value: number }> = []

  for (const key of Object.keys(definedScreens)) {
    screens.push({
      key,
      value: parseInt(definedScreens[key])
    })
  }

  return screens.sort((s1, s2) => {
    return s1.value >= s2.value ? 1 : -1
  })
}
