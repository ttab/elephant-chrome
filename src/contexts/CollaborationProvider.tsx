import {
  createContext,
  type PropsWithChildren,
  useMemo,
  useState,
  useContext,
  useEffect
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession } from 'next-auth/react'
import { Collaboration } from '@/defaults'
import { HPWebSocketProviderContext } from '.'
import type * as Y from 'yjs'
import { createStateless, StatelessType } from '@/shared/stateless'
import { useModal } from '@/components/Modal/useModal'
import { useKeydownGlobal } from '@/hooks/useKeydownGlobal'
import { Button } from '@ttab/elephant-ui'

export interface AwarenessUserData {
  name: string
  initials: string
  color: string
  avatar?: string
}

export type AwarenessStates = Array<{
  clientId: number
  data: AwarenessUserData
  focus?: {
    key: string
    color: string
  }
}>

export interface CollaborationProviderState {
  provider?: HocuspocusProvider
  documentId?: string
  connected: boolean
  synced: boolean
  user: AwarenessUserData
}

const initialState: CollaborationProviderState = {
  provider: undefined,
  documentId: undefined,
  connected: false,
  synced: false,
  user: {
    name: '',
    initials: '',
    color: '',
    avatar: undefined
  }
}


// Create the context
export const CollaborationContext = createContext(initialState)

export const CollaborationProviderContext = ({ documentId, document, children }: PropsWithChildren & {
  documentId?: string
  document?: Y.Doc
}): JSX.Element => {
  const { webSocket } = useContext(HPWebSocketProviderContext)
  const { data, status } = useSession()

  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [provider, setProvider] = useState<HocuspocusProvider>()

  // Developer tool to display current document source in a dialog
  const { showModal, hideModal } = useModal()
  useKeydownGlobal((evt) => {
    if (evt.key === 'u' && evt.shiftKey && evt.metaKey) {
      if (!provider?.document) {
        return
      }

      showModal(
        <div className='whitespace-pre flex flex-col gap-2 h-full overflow-hidden p-2'>
          <h1 className='text-lg font-bold shrink p-2'>Document source</h1>

          <div className='text-xs font-mono overflow-auto p-2 border bg-muted rounded-md'>
            {JSON.stringify(provider.document.toJSON(), null, 2)}
          </div>

          <div className='shrink text-right p-2'>
            <Button onClick={hideModal}>Close</Button>
          </div>
        </div>
      )
    }
  })

  if (status !== 'authenticated') {
    throw new Error('Collaboration is not allowed without a valid access_token')
  }

  useEffect(() => {
    if (!documentId || !webSocket) {
      return
    }

    const provider = new HocuspocusProvider({
      websocketProvider: webSocket,
      name: documentId,
      document,
      token: data.accessToken,

      onConnect: () => {
        setConnected(true)
      },
      onClose() {
        setConnected(false)
      },
      onSynced: () => {
        setSynced(true)
      },
      onDisconnect: () => {
        setSynced(false)
      }
    })

    setProvider(provider)

    return () => {
      // Provider must be destroyed first, then unset, to trigger correct events in collaboration server
      provider.destroy()
      setProvider(undefined)
    }
    // JWT.token should be used on creation but provider should not be recreated on token change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, document, webSocket])

  useEffect(() => {
    // When the token is refreshed we need to send it to the server
    // and update the connection context with the new token
    provider?.sendStateless(createStateless(StatelessType.AUTH, { accessToken: data.accessToken || '' }))
  }, [provider, data.accessToken])

  // Awareness user data
  const user = useMemo((): AwarenessUserData => {
    const colors = Object.keys(Collaboration.colors)
    return {
      name: data?.user.name,
      initials: data?.user.name.split(' ').map((t) => t.substring(0, 1)).join(''),
      color: colors[Math.floor(Math.random() * colors.length)],
      avatar: undefined
    }
  }, [data?.user.name])


  const state = {
    provider,
    documentId,
    connected,
    synced,
    user
  }

  return (
    <>
      {!!provider && (
        <CollaborationContext.Provider value={{ ...state }}>
          {children}
        </CollaborationContext.Provider>
      )}
    </>
  )
}
