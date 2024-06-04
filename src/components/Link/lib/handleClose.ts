import { type NavigationAction, NavigationActionType, type ContentState } from '@/types'

interface Reset {
  viewId: string
  dispatch: React.Dispatch<NavigationAction>
}
export function handleClose({ viewId, dispatch }: Reset): void {
  const content: ContentState[] = history.state.contentState

  const newContent = content.filter(obj => obj.viewId !== viewId)
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
