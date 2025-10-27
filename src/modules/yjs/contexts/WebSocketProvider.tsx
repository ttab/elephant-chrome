import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { WebSocketContext } from "./WebSocketContext"

export function WebSocketProvider({ url, children }: PropsWithChildren & {
  url: string
}) {
  const wsp = useRef<HocuspocusProviderWebsocket | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    if (wsp.current) {
      return
    }

    wsp.current = new HocuspocusProviderWebsocket({
      url,
      autoConnect: false
    })

    // setInterval(() => {
    //   const ws = wsp.current?.webSocket
    //   if (!ws) return

    //   const status = ['connecting', 'open', 'closing', 'closed'][ws.readyState]
    //   console.info('   ws  is ', status)
    //   console.info('   wsp is ', wsp.current?.status, `(${isConnected})`)
    // }, 1000)

    wsp.current.on('error', (error: Error) => {
      console.info('⚠️ WebSocket provider error', error)
      setIsConnected(true)
    })

    wsp.current.on('open', () => {
      console.info('🔌 WebSocket provider connection opened')
      setIsConnected(true)
    })

    wsp.current.on('disconnect', ({ event }: { event?: CloseEvent }) => {
      console.warn('❌ WebSocket provider disconnected:', event?.code, event?.reason)
      setIsConnected(false)
    })

    // Connect to the WebSocket server when the provider is created
    wsp.current.connect()
  }, [url])

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      url,
      webSocketProvider: wsp.current
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}
