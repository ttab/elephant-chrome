import {
  createContext,
  type PropsWithChildren,
  useState,
  useContext,
  useEffect
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession } from '@/hooks'
import { HPWebSocketProviderContext } from '.'

export interface DocTrackerProviderState {
  provider?: HocuspocusProvider
  documentId?: string
  connected: boolean
  synced: boolean
}

const initialState: DocTrackerProviderState = {
  provider: undefined,
  documentId: undefined,
  connected: false,
  synced: false
}


// Create the context
export const DocTrackerContext = createContext(initialState)

interface CollabContextProviderProps extends PropsWithChildren {
  documentId?: string
}

export const DocTrackerProviderContext = ({ children }: CollabContextProviderProps): JSX.Element => {
  const { webSocket } = useContext(HPWebSocketProviderContext)
  const { jwt } = useSession()
  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)
  const [provider, setProvider] = useState<HocuspocusProvider>()

  if (!jwt?.access_token) {
    throw new Error('DocTracker is not allowed without a valid access_token')
  }

  useEffect(() => {
    if (!webSocket) {
      return
    }

    const provider = new HocuspocusProvider({
      websocketProvider: webSocket,
      name: 'document-tracker',
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
      provider.destroy()
      setProvider(undefined)
    }
  }, [webSocket, jwt?.access_token])

  const state = {
    provider,
    connected,
    synced
  }

  return (
    <>
      {!!provider &&
        <DocTrackerContext.Provider value={{ ...state }}>
          {children}
        </DocTrackerContext.Provider>
      }
    </>
  )
}
