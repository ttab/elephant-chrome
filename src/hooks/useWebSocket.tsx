import { useCallback, useContext, useEffect } from 'react'
import { WebSocketProviderContext, type WebSocketProviderState } from '@/contexts/WebSocketProvider'

export const useWebSocket = (onMessage: (msg: string) => void): [(data: string | ArrayBufferLike | Blob | ArrayBufferView) => void, WebSocketProviderState] => {
  const context = useContext(WebSocketProviderContext)

  if (context?.webSocket === undefined) {
    throw new Error('useWebSocket must be used within an WebSocketProvider')
  }

  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (context?.webSocket?.current) {
      context.webSocket.current.send(data)
    }
  }, [context])

  const receiveMessage = useCallback((event: { data: string }) => {
    onMessage(event.data || '')
  }, [onMessage])

  useEffect(() => {
    if (context?.webSocket?.current) {
      context.webSocket.current.addEventListener('message', receiveMessage)
    }

    return () => {
      if (context?.webSocket?.current) {
        context.webSocket.current.removeEventListener('message', receiveMessage)
      }
    }
  }, [context, receiveMessage])

  return [sendMessage, context]
}
