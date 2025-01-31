import { useHistory, useLink } from '@/hooks/index'
import { useUserTracker } from '@/hooks/useUserTracker'
import type { HistoryState } from '@/navigation/hooks/useHistory'
import { Button } from '@ttab/elephant-ui'
import { Plus } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

const Root = (): JSX.Element => {
  const { data } = useSession()

  return data?.user.sub
    ? (
        <ControllerContent />
      )
    : (
        <>children</>
      )
}

const ControllerContent = (): JSX.Element => {
  const addWire = useLink('Wires')
  const { replaceState, state } = useHistory()
  const [wiresHistory, setWiresHistory] = useUserTracker<HistoryState>('Wires')

  useEffect(() => {
    // Load state from userTracker if it doesn't match the current state
    if (wiresHistory && wiresHistory.contentState[0].viewId !== state?.contentState[0].viewId) {
      replaceState(wiresHistory?.contentState[0].path, wiresHistory)
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

export { Root as Controller }
