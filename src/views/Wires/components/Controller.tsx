import { AwarenessDocument } from '@/components/AwarenessDocument'
import { useHistory, useLink } from '@/hooks/index'
import { useCollaboration } from '@/hooks/useCollaboration'
import type { HistoryState } from '@/navigation/hooks/useHistory'
import { Button } from '@ttab/elephant-ui'
import { Plus } from '@ttab/elephant-ui/icons'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

const Root = (): JSX.Element => {
  const { data } = useSession()

  return data?.user.sub
    ? (
        <AwarenessDocument documentId={data.user.sub}>
          <ControllerContent />
        </AwarenessDocument>
      )
    : (
        <>children</>
      )
}

const ControllerContent = (): JSX.Element => {
  // TODO: use useUser
  const { provider } = useCollaboration()
  const { replaceState, state } = useHistory()
  const addWire = useLink('Wires')

  useEffect(() => {
    // Initialize Wires
    if (provider?.synced && isInit(state)) {
      const ele = provider.document.getMap('ele')
      const wiresHistory = (ele?.get('Wires') as HistoryState[])?.[0]

      // When we have a contentState for Wires that we can use, load it.
      if (wiresHistory && !isInit(wiresHistory)) {
        replaceState(wiresHistory.contentState[0].path, wiresHistory)
      } else {
        // Otherwise, create a new Wires contentState.
        const newPath = window.location.href
        const newContentState = wiresHistory.contentState.map((s) => ({
          ...s,
          path: newPath,
          props: { ...s.props, source: 'init' }
        }))

        replaceState(newPath, { ...wiresHistory, contentState: newContentState })
      }
    }
  }, [provider, replaceState, state])

  useEffect(() => {
    if (state?.contentState.every((s) => s.name === 'Wires')) {
      provider?.document.getMap('ele').set('Wires', [state])
    }
  }, [state, provider])

  return (
    <Button
      variant='ghost'
      className='w-9 px-0'
      onClick={(event) =>
        addWire(event, {}, 'last')}
    >
      <Plus strokeWidth={1.75} size={18} />
    </Button>
  )
}

export { Root as Controller }

function isInit(state: HistoryState | null): boolean {
  if (!state) return true

  return state.contentState.length === 1 && !state.contentState[0].props?.source
}
