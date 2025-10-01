import type { PropsWithChildren } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { WebSocketContext } from './WebSocketContext'
import { useIsOnline } from '../hooks/useIsOnline.tsx'

export function WebSocketProvider({ url, children }: PropsWithChildren & {
  url: string
}) {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const isOnline = useIsOnline()

  const websocketProvider = useMemo(() => {
    return new HocuspocusProviderWebsocket({ url })
  }, [url])

  useEffect(() => {
    // Set up event listeners only once when the provider is created
    const handleConnect = () => {
      console.info('✅ WebSocket connected')
      setIsConnected(true)
    }

    const handleDisconnect = ({ event }: { event?: CloseEvent }) => {
      console.warn('❌ WebSocket disconnected:', event?.code, event?.reason)
      setIsConnected(false)
    }

    websocketProvider.on('connect', handleConnect)
    websocketProvider.on('disconnect', handleDisconnect)

    return () => {
      websocketProvider.off('connect', handleConnect)
      websocketProvider.off('disconnect', handleDisconnect)
    }
  }, [websocketProvider])

  return (
    <WebSocketContext.Provider value={{
      isOnline,
      isConnected,
      url,
      websocketProvider
    }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}
