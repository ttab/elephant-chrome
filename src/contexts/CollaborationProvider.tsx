import {
  createContext,
  type PropsWithChildren,
  useMemo,
  useState,
  useContext,
  useEffect
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession } from '@/hooks'
import { Collaboration } from '@/defaults'
import { HPWebSocketProviderContext } from '.'
import type * as Y from 'yjs'

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
  const { jwt } = useSession()
  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [provider, setProvider] = useState<HocuspocusProvider>()

  if (!jwt?.access_token) {
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
      token: jwt.access_token,

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
  }, [documentId, document, webSocket, jwt?.access_token])

  // Awareness user data
  const user = useMemo((): AwarenessUserData => {
    const colors = Object.keys(Collaboration.colors)
    return {
      name: jwt.sub_name,
      initials: jwt.sub_name.split(' ').map(t => t.substring(0, 1)).join(''),
      color: colors[Math.floor(Math.random() * colors.length)],
      avatar: undefined
    }
  }, [jwt?.sub_name])


  const state = {
    provider,
    documentId,
    connected,
    synced,
    user
  }

  return (
    <>
      {!!provider &&
        <CollaborationContext.Provider value={{ ...state }}>
          {children}
        </CollaborationContext.Provider >
      }
    </>
  )
}
