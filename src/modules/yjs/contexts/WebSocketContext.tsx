import type { HocuspocusProviderWebsocket } from '@hocuspocus/provider'
import { createContext } from 'react'

export interface WebSocketContextType {
  url: string
  websocketProvider: HocuspocusProviderWebsocket | null
  isConnected: boolean
  isOnline: boolean
}

export const WebSocketContext = createContext<WebSocketContextType>({
  url: '',
  websocketProvider: null,
  isConnected: false,
  isOnline: false
})
