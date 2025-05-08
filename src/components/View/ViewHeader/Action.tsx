import { type PropsWithChildren } from 'react'
import { ViewFocus } from './ViewFocus'
import { ViewDialogClose } from './ViewDialogClose'
import { type HistoryInterface } from '@/navigation/hooks/useHistory'
import { useHistory, useNavigation, useView } from '@/hooks'
import type { NavigationState } from '@/types'
import { snapshot } from '@/lib/snapshot'


export const Action = ({ onDialogClose = undefined, children }: PropsWithChildren & {
  onDialogClose?: () => void
}): JSX.Element => {
  const { viewId, isFocused } = useView()
  const { state } = useNavigation()
  const history = useHistory()

  const closer = onDialogClose || (() => {
    const currentState = history.state?.contentState.find((obj) => obj.viewId === viewId)

    if (currentState?.name === 'Editor' && currentState?.props?.id && !currentState.props.version) {
      void snapshot(currentState.props.id)
    }
    handleClose(viewId, state, history)
  })

  return (
    <div className='flex flex-row gap-1 items-center justify-end h-14'>

      {children}

      {(!onDialogClose && state.content.length > 1) && (
        <ViewFocus viewId={viewId} />
      )}

      {((onDialogClose || state.content.length > 1) && !isFocused) && (
        <ViewDialogClose onClick={closer} />
      )}
    </div>
  )
}

function handleClose(
  viewId: string,
  state: NavigationState,
  history: HistoryInterface
): void {
  const content = history.state?.contentState || []
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
    history.pushState(view.path, {
      viewId: preserveActiveId ? viewId : view.viewId,
      contentState: afterRemoved
    })
    return
  }

  // When the full backwards navigation finish, add history items back one by one
  window.addEventListener('popstate', () => {
    const newContent = [...beforeRemoved]

    for (const view of afterRemoved) {
      newContent.push(view)
      const activeViewId = (preserveActiveId && newContent.findIndex((v) => v.viewId === state.active) === -1)

      history.pushState(view.path, {
        viewId: activeViewId ? viewId : view.viewId,
        contentState: newContent
      })
    }
  }, { once: true })

  // Trigger backwards navigation to just before
  // the removed item was added originally.
  history.go(-(afterRemoved.length + 1))
}
