import type { NavigationState, ViewRegistryItem, View, ContentState } from '@/types'
import { ViewWrapper } from '@/components'
import * as views from '@/views'
import * as uuid from 'uuid'
import { ViewProvider } from '@/contexts'
import {
  currentView,
  calculateViewWidths
} from '@/navigation/lib'

const registeredComponents = new Map() as Map<string, ViewRegistryItem>

export function initializeNavigationState(): NavigationState {
  Object.keys(views).forEach((name) => {
    registeredComponents.set(name, {
      component: views[name as View],
      meta: views[name as View].meta
    })
  })

  const { name, props } = currentView()
  // Initialize navigationstate from scratch if no contentState exists (or is empty []) in history
  if (!history?.state?.contentState?.length) {
    const InititalView = viewRegistry.getByPath(window.location.pathname)
    const viewId = uuid.v4()

    history.replaceState({
      viewId,
      viewName: name,
      contentState: [{
        viewId,
        name,
        props,
        path: window.location.pathname
      }]
    }, '', window.location.href)

    return {
      viewRegistry,
      views: [{ name, colSpan: 12 }],
      focus: null,
      active: viewId,
      content: [(
        <ViewProvider key={viewId} viewId={viewId} name={name}>
          <ViewWrapper colSpan={12}>
            <InititalView.component {...props} />
          </ViewWrapper>
        </ViewProvider>
      )]
    }
  }


  // Recreate navigationstate from history when contentState exist in history
  const preContent: ContentState[] = history.state.contentState.map((item: ContentState): { name: string } => {
    return item
  })
  const widths = calculateViewWidths(viewRegistry, preContent)

  const content = history.state.contentState.map((item: ContentState, index: number): JSX.Element => {
    const Component = viewRegistry.get(item.name)?.component
    const width = widths[index]

    return (
      <ViewProvider key={item.viewId} viewId={item.viewId} name={item.name}>
        <ViewWrapper colSpan={width.colSpan}>
          <Component {...item.props} />
        </ViewWrapper>
      </ViewProvider>
    )
  })

  return {
    viewRegistry,
    views: widths,
    focus: null,
    active: history.state.id,
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
