import type { NavigationState, ViewRegistryItem, View, ContentState } from '@/types'
import { ViewWrapper } from '@/components'
import * as views from '@/views'
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
    const viewId = crypto.randomUUID()
    let InititalView: ViewRegistryItem

    try {
      InititalView = viewRegistry.getByPath(window.location.pathname)
    } catch (ex) {
      // TODO: Refactor this funtionality so that it is easy to reuse in different situations
      InititalView = viewRegistry.getByPath(`${import.meta.env.BASE_URL || ''}/error`)

      props.title = 'Felaktig länk!'
      props.message = 'Den länk du angav verkar inte leda någonstans. Kontrollera länken noga och försök igen.'

      return {
        viewRegistry,
        views: [{ name: 'Error', colSpan: 12 }],
        focus: null,
        active: viewId,
        content: [(
          <ViewWrapper key={viewId} viewId={viewId} name={'Error'} colSpan={12}>
            <InititalView.component {...props} />
          </ViewWrapper>
        )]
      }
    }

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
        <ViewWrapper key={viewId} viewId={viewId} name={name} colSpan={12}>
          <InititalView.component {...props} />
        </ViewWrapper>
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
    const { colSpan } = widths[index]

    return (
      <ViewWrapper key={item.viewId} viewId={item.viewId} name={item.name} colSpan={colSpan}>
        <Component {...item.props} />
      </ViewWrapper>
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
