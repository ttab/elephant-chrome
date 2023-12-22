import { useEffect } from 'react'
import { Button } from '@ttab/elephant-ui'
import { Maximize2, Minimize2 } from '@ttab/elephant-ui/icons'

import { useNavigation } from '@/hooks'
import { NavigationActionType, type ViewProps } from '@/types'

export const ViewFocus = ({ id }: ViewProps): JSX.Element => {
  const { state, dispatch } = useNavigation()

  useEffect(() => {
    const close = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && state.focus === id) {
        e.preventDefault()
        dispatch({
          type: NavigationActionType.FOCUS,
          id
        })
      }
    }

    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [dispatch, id, state.focus])

  return (
    <Button
      variant='ghost'
      className='w-9 px-0'
      onClick={() => {
        dispatch({
          type: NavigationActionType.FOCUS,
          id
        })
      }}
    >
      {state.focus === id
        ? <Minimize2 className='h-[1.2rem] w-[1.2rem]' />
        : <Maximize2 className='h-[1.2rem] w-[1.2rem]' />
      }
    </Button>
  )
}
