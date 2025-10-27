import type { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { createContext } from 'react'

export interface WebSocketContextType {
  url: string
  webSocketProvider: HocuspocusProviderWebsocket | null
  isConnected: boolean
}

export const WebSocketContext = createContext<WebSocketContextType>({
  url: '',
  webSocketProvider: null,
  isConnected: false
})
