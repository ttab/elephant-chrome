import { useEffect, type JSX } from 'react'
import { Button } from '@ttab/elephant-ui'
import { Maximize2Icon, Minimize2Icon } from '@ttab/elephant-ui/icons'

import { useNavigation } from '@/hooks'
import { NavigationActionType } from '@/types'

export const ViewFocus = ({ viewId }: { viewId: string }): JSX.Element => {
  const { state, dispatch } = useNavigation()

  useEffect(() => {
    const close = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && state.focus === viewId) {
        e.preventDefault()
        dispatch({
          type: NavigationActionType.FOCUS,
          viewId
        })
      }
    }

    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [dispatch, viewId, state.focus])

  return (
    <Button
      variant='ghost'
      className='w-9 h-9 px-0 hover:bg-gray-200 dark:hover:bg-table-focused'
      onClick={() => {
        dispatch({
          type: NavigationActionType.FOCUS,
          viewId
        })
      }}
    >
      {state.focus === viewId
        ? <Minimize2Icon size={18} strokeWidth={1.75} />
        : <Maximize2Icon size={18} strokeWidth={1.75} />}
    </Button>
  )
}
