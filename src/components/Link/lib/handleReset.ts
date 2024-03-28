import { type NavigationAction, NavigationActionType, type ContentState } from '@/types'

interface Reset {
  viewId: string
  dispatch: React.Dispatch<NavigationAction>
}
export function handleReset({ viewId, dispatch }: Reset): void {
  const content: ContentState[] = history.state.contentState

  // If the viewId is the last in the content state, do nothing
  if (viewId === content[content.length - 1].viewId) {
    return
  }

  const newContent = content.slice(0, content.findIndex(obj => obj.viewId === viewId) + 1)
  const newActive = newContent[newContent.length - 1]


  // Set history state first, then navigation state
  history.pushState({
    viewId,
    props: newActive.props,
    viewName: newActive.name,
    contentState: newContent
  }, newActive.name, `${newActive.path}`)

  dispatch({
    type: NavigationActionType.SET,
    content: newContent
  })
}
