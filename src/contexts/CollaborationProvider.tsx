import {
  createContext,
  type PropsWithChildren,
  useMemo,
  useState
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useApi, useSession } from '@/hooks'
import { Collaboration } from '@/defaults'

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
  states: AwarenessStates
}

const initialUserData = {
  name: 'Jone Doe',
  initials: 'J D',
  color: 'gray',
  avatar: undefined
}

const initialState: CollaborationProviderState = {
  provider: undefined,
  documentId: undefined,
  connected: false,
  synced: false,
  user: initialUserData,
  states: []
}


// Create the context
export const CollaborationContext = createContext(initialState)


// Create the context provider component
interface CollabContextProviderProps extends PropsWithChildren {
  documentId?: string
}

export const CollaborationProviderContext = ({ documentId, children }: CollabContextProviderProps): JSX.Element => {
  const { hocuspocusWebsocket } = useApi()
  const { jwt } = useSession()
  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [states, setStates] = useState<AwarenessStates>([])

  const provider = useMemo(() => {
    if (!documentId || !hocuspocusWebsocket || !jwt?.access_token) {
      return
    }

    const provider = new HocuspocusProvider({
      websocketProvider: hocuspocusWebsocket,
      name: documentId,
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
      },
      onAwarenessChange: (data) => {
        setStates(data.states as AwarenessStates)
      },
      onAwarenessUpdate: (data) => {
        setStates(data.states as AwarenessStates)
      }
    })

    return provider
  }, [documentId, hocuspocusWebsocket, jwt?.access_token])

  // Awareness user data
  const user = useMemo((): AwarenessUserData => {
    if (!jwt?.access_token) {
      return initialUserData
    }

    const colors = Object.keys(Collaboration.colors)
    return {
      name: jwt.sub_name,
      initials: jwt.sub_name.split(' ').map(t => t.substring(0, 1)).join(' '),
      color: colors[Math.floor(Math.random() * colors.length)],
      avatar: undefined
    }
  }, [jwt?.access_token, jwt?.sub_name])


  const state = {
    provider,
    documentId,
    connected,
    synced,
    user,
    states
  }

  return (
    <CollaborationContext.Provider value={{ ...state }}>
      {children}
    </CollaborationContext.Provider>
  )
}
