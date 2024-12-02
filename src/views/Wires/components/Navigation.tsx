import { useHistory } from '@/hooks/index'
import type { HistoryState } from '@/navigation/hooks/useHistory'
import type { ContentState } from '@/types/index'
import { Button } from '@ttab/elephant-ui'
import { ChevronLeft, ChevronRight } from '@ttab/elephant-ui/icons'

type Direction = 'left' | 'right'

const canNavigate = (
  visibleContent: ContentState[],
  availableContent: ContentState[],
  direction: Direction
): boolean => {
  const visibleIds = visibleContent.map((item) => item.viewId)
  const availableIds = availableContent.map((item) => item.viewId)

  if (direction === 'left') {
    const firstVisibleIndex = availableIds.indexOf(visibleIds[0])
    return firstVisibleIndex > 0
  } else if (direction === 'right') {
    const lastVisibleIndex = availableIds.indexOf(visibleIds[visibleIds.length - 1])
    return lastVisibleIndex < availableIds.length - 1
  }
  return false
}

const navigate = (
  contentState: ContentState[],
  replaceState: (url: string, state: HistoryState) => void,
  active: string,
  modifier: number
) => {
  const currentIdx = contentState.findIndex((obj) => obj.viewId === active)
  const newIdx = currentIdx + modifier

  replaceState(contentState[newIdx].path, {
    viewId: contentState[newIdx].viewId,
    contentState
  })
}

export const Navigation = ({ visibleContent }: {
  visibleContent: ContentState[]
}): JSX.Element | null => {
  const { state, replaceState } = useHistory()
  const isWires = state?.contentState.some((c) => c.name === 'Wires')

  if (!isWires || state?.contentState === undefined) {
    return null
  }

  return (
    <>
      {canNavigate(visibleContent, state?.contentState, 'left') && (
        <Button
          variant='outline'
          className='fixed top-1/2 transform -translate-y-1/2 left-4 z-50'
          onClick={() => navigate(
            state.contentState,
            replaceState,
            state.viewId,
            -1)}
        >
          <ChevronLeft strokeWidth={1.75} size={18} className='text-muted-foreground' />
        </Button>
      )}
      {canNavigate(visibleContent, state?.contentState, 'right') && (
        <Button
          variant='outline'
          className='fixed top-1/2 transform -translate-y-1/2 right-4 z-50'
          onClick={() => navigate(
            state.contentState,
            replaceState,
            state.viewId,
            1)}
        >
          <ChevronRight strokeWidth={1.75} size={18} className='text-muted-foreground' />
        </Button>
      )}
    </>
  )
}
