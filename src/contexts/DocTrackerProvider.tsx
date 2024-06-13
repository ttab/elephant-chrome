import {
  createContext,
  type PropsWithChildren,
  useState,
  useContext,
  useMemo
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession } from 'next-auth/react'
import { HPWebSocketProviderContext } from '.'

interface DocTrackerProviderState {
  provider?: HocuspocusProvider
  connected: boolean
  synced: boolean
}

const initialState: DocTrackerProviderState = {
  provider: undefined,
  connected: false,
  synced: false
}


// Create the context
export const DocTrackerContext = createContext(initialState)

interface DocTrackerContextProviderProps extends PropsWithChildren {
  documentId?: string
}

export const DocTrackerProvider = ({ children }: DocTrackerContextProviderProps): JSX.Element => {
  const { webSocket } = useContext(HPWebSocketProviderContext)
  const { data, status } = useSession()

  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)

  if (status !== 'authenticated') {
    throw new Error('DocTracker is not allowed without a valid access_token')
  }

  const provider = useMemo(() => {
    if (!webSocket) {
      return
    }

    return new HocuspocusProvider({
      websocketProvider: webSocket,
      name: 'document-tracker',
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
    // JWT.token should be used on creation, but provider should not be recreated on token change
    // In this case we don't need to update the token since auth is done on when provider opens the connection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webSocket])

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
