import { useHistory, useLink } from '@/hooks/index'
import { useUserTracker } from '@/hooks/useUserTracker'
import type { HistoryState } from '@/navigation/hooks/useHistory'
import { Button } from '@ttab/elephant-ui'
import { Plus } from '@ttab/elephant-ui/icons'
import { useEffect } from 'react'

export const Controller = (): JSX.Element => {
  const addWire = useLink('Wires')
  const { replaceState, state } = useHistory()
  const [wiresHistory, setWiresHistory] = useUserTracker<HistoryState>('Wires')

  useEffect(() => {
    // Load state from userTracker we're not in a initial state
    if (wiresHistory && loadState(state, wiresHistory)) {
      replaceState(wiresHistory.contentState[0].path, wiresHistory)
    }
  }, [replaceState, state, wiresHistory, setWiresHistory])

  return (
    <div className='flex justify-between'>
      <Button
        variant='ghost'
        className='w-9 px-0'
        onClick={(event) => {
          addWire(event, {}, 'last')
          if (state) {
            setWiresHistory(state)
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
