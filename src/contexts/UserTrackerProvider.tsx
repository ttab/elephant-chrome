import {
  createContext,
  type PropsWithChildren,
  useState,
  useMemo,
  useEffect,
  useRef,
  type JSX
} from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { useSession } from 'next-auth/react'
import { useWebSocket } from '@/modules/yjs/hooks'

interface UserTrackerProviderState {
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
  const { webSocketProvider } = useWebSocket()
  const { data, status } = useSession()

  const [synced, setSynced] = useState<boolean>(false)
  const [connected, setConnected] = useState<boolean>(false)

  if (status !== 'authenticated') {
    throw new Error('UserTracker is not allowed without a valid access_token')
  }

  const accessTokenRef = useRef(data.accessToken)
  accessTokenRef.current = data.accessToken

  const provider = useMemo(() => {
    if (!webSocketProvider) {
      return
    }

    return new HocuspocusProvider({
      websocketProvider: webSocketProvider,
      name: data.user.sub.replace('core://user/', ''),
      token: () => accessTokenRef.current,
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
  }, [webSocketProvider])

  const state = {
    provider,
    connected,
    synced
  }

  // TODO: This is duplicated in CollaborationProvider, there might be room for improvement
  useEffect(() => {
    void provider?.sendToken()
  }, [provider, data.accessToken])

  if (provider) {
    provider.attach()
  }
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
