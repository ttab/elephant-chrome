import { useContext } from 'react'
import { WebSocketContext, type WebSocketContextType } from '../contexts/WebSocketContext'

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext)

  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }

  return context
}
