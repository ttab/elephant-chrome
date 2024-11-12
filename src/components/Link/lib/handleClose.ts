import {
  type NavigationAction,
  type ContentState,
  type NavigationState,
  NavigationActionType
} from '@/types'

export function handleClose({ viewId, state, dispatch }: {
  viewId: string
  state: NavigationState
  dispatch: React.Dispatch<NavigationAction>
}): void {
  const content: ContentState[] = history.state.contentState
  const indexToRemove = content.findIndex((obj) => obj.viewId === viewId)

  if (content.length === 1 || indexToRemove === -1) {
    console.warn('Tried to close unknown view or the last view visible, ignoring.')
    return
  }

  // If the active view is not removed we want the active view to stay active
  const preserveActiveId = state.active !== viewId

  // If it is the last view being removed, simply go back one step in the history
  if (indexToRemove === content.length - 1) {
    history.go(-1)
    return
  }

  // Split views into before/after the view to remove
  const beforeRemoved = content.slice(0, indexToRemove)
  const afterRemoved = content.slice(indexToRemove + 1)

  // If it is the first view being removed, hide it and push new history item.
  // This way the user can navigate back to the previous state.
  if (indexToRemove === 0) {
    const view = afterRemoved[0]
    history.pushState({
      viewId: preserveActiveId ? viewId : view.viewId,
      props: view.props,
      viewName: view.name,
      contentState: afterRemoved
    }, view.name, `${view.path}`)

    dispatch({
      type: NavigationActionType.SET,
      content: afterRemoved
    })
    return
  }

  // When the full backwards navigation finish, add history items back one by one
  window.addEventListener('popstate', () => {
    const newContent = [...beforeRemoved]
    const activeViewId = (preserveActiveId && newContent.findIndex((v) => v.viewId === state.active) === -1)

    for (const view of afterRemoved) {
      newContent.push(view)
      history.pushState({
        viewId: activeViewId || view.viewId,
        props: view.props,
        viewName: view.name,
        contentState: newContent
      }, view.name, `${view.path}`)
    }

    // Lastly we set our final state to render all views correctly
    dispatch({
      type: NavigationActionType.SET,
      content: newContent
    })
  }, { once: true })

  // Trigger backwards navigation to just before
  // the removed item was added originally.
  history.go(-(afterRemoved.length + 1))
}
