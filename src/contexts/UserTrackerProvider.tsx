import {
  createContext,
  type PropsWithChildren,
  useState,
  useContext,
  useMemo,
  useEffect
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession } from 'next-auth/react'
import { HPWebSocketProviderContext } from '.'
import { createStateless, StatelessType } from '@/shared/stateless'

export interface UserTrackerProviderState {
  provider?: HocuspocusProvider
  connected: boolean
  synced: boolean
}

const initialState: UserTrackerProviderState = {
  provider: undefined,
  connected: false,
  synced: false
}


// Create the context
export const UserTrackerContext = createContext(initialState)

export const UserTrackerProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const { webSocket } = useContext(HPWebSocketProviderContext)
  const { data, status } = useSession()

  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)

  if (status !== 'authenticated') {
    throw new Error('UserTracker is not allowed without a valid access_token')
  }

  const provider = useMemo(() => {
    if (!webSocket) {
      return
    }

    return new HocuspocusProvider({
      websocketProvider: webSocket,
      name: data.user.sub.replace('core://user/', ''),
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

  // TODO: This is duplicated in CollaborationProvider, there might be room for improvement
  useEffect(() => {
    // When the token is refreshed we need to send it to the server
    // and update the connection context with the new token
    provider?.sendStateless(createStateless(StatelessType.AUTH, { accessToken: data.accessToken || '' }))
  }, [provider, data.accessToken])

  return (
    <>
      {!!provider
      && (
        <UserTrackerContext.Provider value={{ ...state }}>
          {children}
        </UserTrackerContext.Provider>
      )}
    </>
  )
}
