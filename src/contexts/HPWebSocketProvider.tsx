import { createContext, useEffect, useRef, useState, useCallback } from 'react'
import { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { useRegistry } from '@/hooks'

interface HPWebSocketProviderState {
  webSocket?: HocuspocusProviderWebsocket
  connected: boolean
}

export const HPWebSocketProviderContext = createContext<HPWebSocketProviderState>({
  webSocket: undefined,
  connected: false
})

export const HPWebSocketProvider = ({ children }: {
  children: React.ReactNode
}): JSX.Element => {
  const { server: { webSocketUrl } } = useRegistry()
  const [webSocket, setWebSocket] = useState<HocuspocusProviderWebsocket | undefined>(undefined)
  const [connected, setConnected] = useState(false)
  const isReconnectingRef = useRef(false)

  // WebSocket connection callback function
  const connect = useCallback(() => {
    if (!webSocketUrl) return
    if (isReconnectingRef.current) return

    isReconnectingRef.current = true

    const ws = new HocuspocusProviderWebsocket({
      url: webSocketUrl.toString(),
      connect: false
    })

    const handleConnect = () => {
      setConnected(true)
      isReconnectingRef.current = false
    }

    const handleDisconnect = () => {
      setConnected(false)
      // Schedule a reconnect in two seconds, not immediately.
      setTimeout(() => {
        connect()
      }, 2000)
    }

    ws.on('connect', handleConnect)
    ws.on('disconnect', handleDisconnect)

    ws.connect()
      .then(() => {
        // Needed on reconnections
        setWebSocket(ws)
      })
      .catch(console.error)

    setWebSocket((oldWs) => {
      return oldWs ? oldWs : ws
    })

    return () => {
      ws.off('connect', handleConnect)
      ws.off('disconnect', handleDisconnect)
    }
  }, [webSocketUrl])

  // Connect everytime a new connect function is created
  useEffect(() => {
    connect()
  }, [connect])

  const value = {
    webSocket,
    connected
  }

  return (
    <HPWebSocketProviderContext.Provider value={value}>
      {children}
      {!connected
      && (
        <div className='flex justify-center items-center bg-red-200 text-red-950 p-3 z-50 h-8 -mt-8'>
          Not synced:
          {' '}
          {JSON.stringify(connected)}
        </div>
      )}
    </HPWebSocketProviderContext.Provider>
  )
}
