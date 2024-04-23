import { createContext, useMemo } from 'react'
import { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { useRegistry } from '@/hooks'

interface HPWebSocketProviderState {
  webSocket?: HocuspocusProviderWebsocket
}

export const HPWebSocketProviderContext = createContext<HPWebSocketProviderState>({
  webSocket: undefined
})

export const HPWebSocketProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { webSocketUrl } } = useRegistry()

  const webSocket = useMemo(() => {
    return (!webSocketUrl) ? undefined : new HocuspocusProviderWebsocket({ url: webSocketUrl.toString() })
  }, [webSocketUrl])


  const value = { webSocket }

  return (
    <HPWebSocketProviderContext.Provider value={value}>
      {children}
    </HPWebSocketProviderContext.Provider>
  )
}
