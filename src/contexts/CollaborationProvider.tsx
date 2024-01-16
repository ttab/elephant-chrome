import {
  createContext,
  type PropsWithChildren,
  useMemo,
  useState
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useApi, useSession } from '@/hooks'
import { Awareness } from '@/defaults'

export interface AwarenessData {
  name: string
  initials: string
  color: string
  avatar?: string
  focusedId?: string
  [key: string]: string | undefined
}

export interface CollaborationProviderState {
  provider?: HocuspocusProvider
  documentId?: string
  connected: boolean
  synced: boolean
  awarenessData: AwarenessData
}

const initialAwarenessData = {
  name: 'Jone Doe',
  initials: 'J D',
  color: 'black',
  avatar: undefined,
  focusedId: undefined
}

const initialState: CollaborationProviderState = {
  provider: undefined,
  documentId: undefined,
  connected: false,
  synced: false,
  awarenessData: initialAwarenessData
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
        console.log('change: ', data)
      },
      onAwarenessUpdate: (data) => {
        console.log('update: ', data)
      }
    })

    return provider
  }, [documentId, hocuspocusWebsocket, jwt?.access_token])

  // Awareness user data and user focused field
  const awarenessData = useMemo((): AwarenessData | undefined => {
    if (!provider?.awareness || !jwt?.access_token) {
      return initialAwarenessData
    }

    return {
      name: jwt.sub_name,
      initials: jwt.sub_name.split(' ').map(t => t.substring(0, 1)).join(' '),
      color: Awareness.colors[Math.floor(Math.random() * Awareness.colors.length)],
      avatar: undefined,
      focusedId: undefined
    }
  }, [provider?.awareness, jwt?.access_token, jwt?.sub_name])


  const state = {
    provider,
    documentId,
    connected,
    synced,
    awarenessData
  }

  return (
    <CollaborationContext.Provider value={{ ...state }}>
      {children}
    </CollaborationContext.Provider>
  )
}
