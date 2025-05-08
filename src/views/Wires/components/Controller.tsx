import { useHistory, useLink } from '@/hooks/index'
import { useUserTracker } from '@/hooks/useUserTracker'
import type { HistoryState } from '@/navigation/hooks/useHistory'
import { Button } from '@ttab/elephant-ui'
import { Cable, Plus } from '@ttab/elephant-ui/icons'
import { useEffect } from 'react'
import { toast } from 'sonner'

export const Controller = (): JSX.Element => {
  const addWire = useLink('Wires')
  const { replaceState, state } = useHistory()
  const [wiresHistory, setWiresHistory] = useUserTracker<HistoryState>('Wires')

  useEffect(() => {
    // Load state from userTracker if we're in a load state
    if (wiresHistory && loadState(state, wiresHistory)) {
      replaceState(wiresHistory.contentState[0].path, wiresHistory)
    }

    // When wiresHistory and state are different and we're not in an initial state, show toast
    if (wiresHistory && !compareStates(state, wiresHistory) && !loadState(state, wiresHistory)) {
      toast('Vill du spara ändringar i urvalet?', {
        id: 'unsaved-changes',
        position: 'bottom-center',
        duration: Infinity,
        icon: <Cable className='pr-1' />,
        action: {
          label: 'Spara',
          onClick: () => {
            if (state) {
              // When persisting a WireHistory set first view as active
              setWiresHistory({
                ...state,
                viewId: state.contentState[0].viewId
              })
              toast.dismiss(('unsaved-changes'))
            }
          }
        }

      })
    } else {
      toast.dismiss(('unsaved-changes'))
    }
    return () => {
      toast.dismiss(('unsaved-changes'))
    }
  }, [replaceState, state, wiresHistory, setWiresHistory])

  return (
    <div className='flex justify-between'>
      <Button
        variant='ghost'
        className='w-9 px-0'
        onClick={(event) => {
          if (state && state.contentState.length < 10) {
            addWire(event, {}, 'last')
            setWiresHistory(state)
          } else {
            toast.error('Du kan max ha 10 telegram-vyer')
          }
        }}
      >
        <Plus strokeWidth={1.75} size={18} />
      </Button>
    </div>
  )
}

function loadState(state: HistoryState | null, wiresHistory: HistoryState | undefined): boolean {
  if (!wiresHistory?.contentState?.[0]) {
    return false
  }

  if (wiresHistory?.contentState.length === 1 && !wiresHistory.contentState[0].props?.source) {
    return false
  }

  return state?.contentState.length === 1 && !state.contentState[0].props?.source
}

function compareStates(state: HistoryState | null, wiresHistoryState: HistoryState | undefined): boolean {
  if (!state?.contentState || !wiresHistoryState?.contentState) {
    return false
  }

  if (state.contentState.length !== wiresHistoryState.contentState.length) {
    return false
  }

  return state.contentState.every((item, index) => item.path === wiresHistoryState.contentState[index].path)
}

