import { type NavigationAction, NavigationActionType, type ContentState } from '@/types'

interface Reset {
  viewId: string
  dispatch: React.Dispatch<NavigationAction>
}
export function handleClose({ viewId, dispatch }: Reset): void {
  const content: ContentState[] = history.state.contentState

  const contentLength = content.length
  const index = content.findIndex((obj) => obj.viewId === viewId)

  // If it is the last view being removed, simply
  // move backwards one step in the history
  if (index === contentLength - 1) {
    history.go(-1)
    return
  }

  // Create new content state without the removed view
  const beforeRemoved = content.slice(0, index)
  const afterRemoved = content.slice(index + 1)
  const newContent = [...beforeRemoved, ...afterRemoved]

  // Setup event to fire once when navigation has finished.
  window.addEventListener('popstate', () => {
    const newActive = newContent[newContent.length - 1]

    // Push the new state to add the views that existed
    // after the removed view.
    history.pushState({
      viewId,
      props: newActive.props,
      viewName: newActive.name,
      contentState: newContent
    }, newActive.name, `${newActive.path}`)

    // Set elephant navigation state
    dispatch({
      type: NavigationActionType.SET,
      content: newContent
    })
  }, { once: true })

  // Trigger backwards navigation to just before
  // the removed item was added originally.
  history.go(-(afterRemoved.length + 1))
}
